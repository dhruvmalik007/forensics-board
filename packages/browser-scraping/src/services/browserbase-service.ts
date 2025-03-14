import { ChainExplorer } from '../types';
import { Browserbase } from '@browserbasehq/sdk';
/**
 * Service for interacting with Browserbase
 */
export class BrowserbaseService {
  private apiKey: string;
  private projectId: string;
  private browserbase: Browserbase; // Using any to avoid type errors with the SDK

  constructor(apiKey?: string, projectId?: string) {
    this.apiKey = apiKey || process.env.BROWSERBASE_API_KEY || '';
    this.projectId = projectId || process.env.BROWSERBASE_PROJECT_ID || '';
    
    if (!this.apiKey) {
      console.warn('No Browserbase API key provided. Browser automation will not work.');
    }
    
    if (!this.projectId) {
      console.warn('No Browserbase Project ID provided. Browser automation will not work.');
    }
    
    // Initialize the Browserbase SDK with the API key
    this.browserbase = new Browserbase({ apiKey: this.apiKey, projectId: this.projectId });
  }

  /**
   * Log structured information about browser operations
   */
  private logOperation(operation: string, details: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      service: 'browserbase',
      operation,
      ...details
    };
    console.log(`[BROWSERBASE_OPERATION] ${JSON.stringify(logEntry)}`);
  }

  /**
   * Create a new browser session
   */
  async createSession(): Promise<{ sessionId: string, page: any }> {
    this.logOperation('SESSION_CREATE_START', {});
    
    try {
      if (!this.apiKey || !this.projectId) {
        throw new Error('Browserbase API key and Project ID are required for session creation');
      }

      // Create a session using the SDK
      const session = await this.browserbase.createSession({
        projectId: this.projectId,
        timeout: 60000, // 1 minute timeout
      });
      
      // Connect to the page
      const page = await this.browserbase.getSession({
        sessionId: session.id,  
      });
      
      this.logOperation('SESSION_CREATE_SUCCESS', { sessionId: session.id });
      return { sessionId: session.id, page };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logOperation('SESSION_CREATE_ERROR', { error: errorMessage });
      throw error;
    }
  }

  /**
   * Navigate to a URL
   */
  async navigateTo(page: any, url: string): Promise<void> {
    const sessionId = page.sessionId;
    this.logOperation('NAVIGATE_START', { sessionId, url });
    
    try {
      // Navigate using the SDK page
      await page.goto(url, { waitUntil: 'networkidle0' });
      this.logOperation('NAVIGATE_SUCCESS', { sessionId, url });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logOperation('NAVIGATE_ERROR', { sessionId, url, error: errorMessage });
      throw error;
    }
  }

  /**
   * Execute JavaScript in the browser
   */
  async executeScript<T>(page: any, script: string): Promise<T> {
    const sessionId = page.sessionId;
    this.logOperation('EXECUTE_SCRIPT_START', { 
      sessionId,
      scriptLength: script.length,
      scriptPreview: script.substring(0, 100) + (script.length > 100 ? '...' : '')
    });
    
    try {
      // Execute script using the SDK page
      const result = await page.evaluate(script);
      this.logOperation('EXECUTE_SCRIPT_SUCCESS', { 
        sessionId,
        resultType: typeof result,
        resultPreview: JSON.stringify(result).substring(0, 100) + (JSON.stringify(result).length > 100 ? '...' : '')
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logOperation('EXECUTE_SCRIPT_ERROR', { sessionId, error: errorMessage });
      throw error;
    }
  }

  /**
   * Get the HTML content of the page
   */
  async getPageContent(page: any): Promise<string> {
    const sessionId = page.sessionId;
    this.logOperation('GET_PAGE_CONTENT_START', { sessionId });
    
    try {
      // Get content using the SDK page
      const content = await page.evaluate(`document.documentElement.outerHTML`);
      this.logOperation('GET_PAGE_CONTENT_SUCCESS', { 
        sessionId,
        contentLength: content.length
      });
      return content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logOperation('GET_PAGE_CONTENT_ERROR', { sessionId, error: errorMessage });
      throw error;
    }
  }

  /**
   * Wait for an element to be visible
   */
  async waitForElement(page: any, selector: string, timeout = 30000): Promise<boolean> {
    const sessionId = page.sessionId;
    this.logOperation('WAIT_FOR_ELEMENT_START', { sessionId, selector, timeout });
    
    try {
      // Wait for element using the SDK page
      await page.waitForSelector(selector, { timeout });
      this.logOperation('WAIT_FOR_ELEMENT_SUCCESS', { sessionId, selector });
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        this.logOperation('WAIT_FOR_ELEMENT_TIMEOUT', { sessionId, selector, timeout });
        return false;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logOperation('WAIT_FOR_ELEMENT_ERROR', { sessionId, selector, error: errorMessage });
      throw error;
    }
  }

  /**
   * Type text into an input field
   */
  async typeText(page: any, selector: string, text: string): Promise<void> {
    const sessionId = page.sessionId;
    this.logOperation('TYPE_TEXT_START', { 
      sessionId, 
      selector, 
      textLength: text.length,
      textPreview: text.substring(0, 20) + (text.length > 20 ? '...' : '')
    });
    
    try {
      // Type text using the SDK page
      await page.click(selector); // Click first to focus
      await page.fill(selector, text);
      this.logOperation('TYPE_TEXT_SUCCESS', { sessionId, selector });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logOperation('TYPE_TEXT_ERROR', { sessionId, selector, error: errorMessage });
      throw error;
    }
  }

  /**
   * Click on an element
   */
  async clickElement(page: any, selector: string): Promise<void> {
    const sessionId = page.sessionId;
    this.logOperation('CLICK_ELEMENT_START', { sessionId, selector });
    
    try {
      // Click element using the SDK page
      await page.click(selector);
      this.logOperation('CLICK_ELEMENT_SUCCESS', { sessionId, selector });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logOperation('CLICK_ELEMENT_ERROR', { sessionId, selector, error: errorMessage });
      throw error;
    }
  }

  /**
   * Close the browser session
   */
  async closeSession(sessionId: string): Promise<void> {
    this.logOperation('SESSION_CLOSE_START', { sessionId });
    
    try {
      // Close session using the SDK
      await this.browserbase.sessions.close({ sessionId });
      this.logOperation('SESSION_CLOSE_SUCCESS', { sessionId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logOperation('SESSION_CLOSE_ERROR', { sessionId, error: errorMessage });
      throw error;
    }
  }

  /**
   * Scrape transactions from LI.FI scan for a specific address
   */
  async scrapeLifiTransactions(address: string): Promise<string> {
    let sessionId: string | null = null;
    let page: any = null;
    
    this.logOperation('LIFI_SCRAPE_START', { address });
    
    try {
      // Create a new browser session
      const session = await this.createSession();
      sessionId = session.sessionId;
      page = session.page;
      
      // Navigate to LI.FI scan
      await this.navigateTo(page, 'https://scan.li.fi/');
      
      // Wait for the search input to be visible
      this.logOperation('LIFI_WAIT_FOR_SEARCH', { sessionId });
      const searchInputVisible = await this.waitForElement(page, 'input[placeholder*="Search"]');
      if (!searchInputVisible) {
        const error = 'Search input not found on LI.FI scan';
        this.logOperation('LIFI_SEARCH_NOT_FOUND', { sessionId });
        throw new Error(error);
      }
      
      // Type the address into the search input
      await this.typeText(page, 'input[placeholder*="Search"]', address);
      
      // Click the search button
      this.logOperation('LIFI_CLICK_SEARCH', { sessionId });
      await this.clickElement(page, 'button[type="submit"]');
      
      // Wait for the results to load
      this.logOperation('LIFI_WAIT_FOR_RESULTS', { sessionId });
      const resultsVisible = await this.waitForElement(page, '.transaction-list', 60000);
      if (!resultsVisible) {
        const error = 'Transaction results not found on LI.FI scan';
        this.logOperation('LIFI_RESULTS_NOT_FOUND', { sessionId });
        throw new Error(error);
      }
      
      // Get the HTML content of the page
      const htmlContent = await this.getPageContent(page);
      
      this.logOperation('LIFI_SCRAPE_SUCCESS', { 
        address,
        contentLength: htmlContent.length
      });
      
      return htmlContent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logOperation('LIFI_SCRAPE_ERROR', { address, error: errorMessage });
      throw error;
    } finally {
      // Close the browser session
      if (sessionId) {
        await this.closeSession(sessionId).catch(error => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logOperation('LIFI_SESSION_CLOSE_ERROR', { sessionId, error: errorMessage });
        });
      }
    }
  }

  /**
   * Scrape transactions from a blockchain explorer for a specific address
   */
  async scrapeExplorerTransactions(explorer: ChainExplorer, address: string): Promise<string> {
    // For LI.FI scan, use the specialized method
    if (explorer.project_name === 'LI.FI') {
      return this.scrapeLifiTransactions(address);
    }
    
    let sessionId: string | null = null;
    let page: any = null;
    
    this.logOperation('EXPLORER_SCRAPE_START', { 
      explorer: explorer.project_name,
      url: explorer.explorer_url,
      address,
      category: explorer.category
    });
    
    try {
      // Create a new browser session
      const session = await this.createSession();
      sessionId = session.sessionId;
      page = session.page;
      
      // Navigate to the explorer
      await this.navigateTo(page, explorer.explorer_url);
      
      // Execute a script to find the search input
      this.logOperation('EXPLORER_FIND_SEARCH_INPUT', { 
        sessionId,
        explorer: explorer.project_name
      });
      
      const searchInputSelector = await this.executeScript<string>(page, `
        // Try common search input selectors
        const selectors = [
          'input[placeholder*="Search"]',
          'input[placeholder*="Address"]',
          'input[type="search"]',
          'input.search-input',
          'input#search-input',
          'input.form-control'
        ];
        
        for (const selector of selectors) {
          const input = document.querySelector(selector);
          if (input) {
            return selector;
          }
        }
        
        return null;
      `);
      
      if (!searchInputSelector) {
        const error = `Search input not found on ${explorer.project_name}`;
        this.logOperation('EXPLORER_SEARCH_INPUT_NOT_FOUND', { 
          sessionId,
          explorer: explorer.project_name
        });
        throw new Error(error);
      }
      
      this.logOperation('EXPLORER_SEARCH_INPUT_FOUND', { 
        sessionId,
        explorer: explorer.project_name,
        selector: searchInputSelector
      });
      
      // Wait for the search input to be visible
      const searchInputVisible = await this.waitForElement(page, searchInputSelector);
      if (!searchInputVisible) {
        const error = `Search input not visible on ${explorer.project_name}`;
        this.logOperation('EXPLORER_SEARCH_INPUT_NOT_VISIBLE', { 
          sessionId,
          explorer: explorer.project_name,
          selector: searchInputSelector
        });
        throw new Error(error);
      }
      
      // Type the address into the search input
      await this.typeText(page, searchInputSelector, address);
      
      // Find and click the search button
      this.logOperation('EXPLORER_FIND_SEARCH_BUTTON', { 
        sessionId,
        explorer: explorer.project_name
      });
      
      const searchButtonSelector = await this.executeScript<string>(page, `
        // Try common search button selectors
        const selectors = [
          'button[type="submit"]',
          'button.search-button',
          'button.btn-search',
          'button.search-submit',
          'button.search-icon',
          'button.search'
        ];
        
        for (const selector of selectors) {
          const button = document.querySelector(selector);
          if (button) {
            return selector;
          }
        }
        
        // If no button found, check if the input has a parent form
        const input = document.querySelector('${searchInputSelector}');
        if (input && input.form) {
          return 'form';
        }
        
        return null;
      `);
      
      if (searchButtonSelector) {
        this.logOperation('EXPLORER_SEARCH_BUTTON_FOUND', { 
          sessionId,
          explorer: explorer.project_name,
          selector: searchButtonSelector
        });
        
        if (searchButtonSelector === 'form') {
          // Submit the form
          this.logOperation('EXPLORER_SUBMIT_FORM', { 
            sessionId,
            explorer: explorer.project_name
          });
          
          await this.executeScript(page, `
            const input = document.querySelector('${searchInputSelector}');
            if (input && input.form) {
              input.form.submit();
            }
          `);
        } else {
          // Click the search button
          this.logOperation('EXPLORER_CLICK_SEARCH_BUTTON', { 
            sessionId,
            explorer: explorer.project_name,
            selector: searchButtonSelector
          });
          
          await this.clickElement(page, searchButtonSelector);
        }
      } else {
        // If no button found, try pressing Enter in the input
        this.logOperation('EXPLORER_PRESS_ENTER', { 
          sessionId,
          explorer: explorer.project_name
        });
        
        await this.executeScript(page, `
          const input = document.querySelector('${searchInputSelector}');
          if (input) {
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13 }));
          }
        `);
      }
      
      // Wait for the results to load (generic wait for any content change)
      this.logOperation('EXPLORER_WAIT_FOR_RESULTS', { 
        sessionId,
        explorer: explorer.project_name,
        waitTime: 5000
      });
      
      // Use the SDK page to wait
      await page.waitForTimeout(5000);
      
      // Get the HTML content of the page
      const htmlContent = await this.getPageContent(page);
      
      this.logOperation('EXPLORER_SCRAPE_SUCCESS', { 
        explorer: explorer.project_name,
        address,
        contentLength: htmlContent.length
      });
      
      return htmlContent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logOperation('EXPLORER_SCRAPE_ERROR', { 
        explorer: explorer.project_name,
        address,
        error: errorMessage
      });
      throw error;
    } finally {
      // Close the browser session
      if (sessionId) {
        await this.closeSession(sessionId).catch(error => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logOperation('EXPLORER_SESSION_CLOSE_ERROR', { 
            sessionId,
            explorer: explorer.project_name,
            error: errorMessage
          });
        });
      }
    }
  }
} 