<a href="https://web3-forensics.vercel.app/">
  <img alt="Web3 Forensics Agent Orchestration" src="app/(chat)/opengraph-image.png">
  <h1 align="center">Web3 Forensics Agent Orchestration</h1>
</a>

<p align="center">
  This project is the submission for ETHSF Hackathon 2025, providing a comprehensive solution for blockchain transaction analysis and forensics through an AI-powered agent system.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#team"><strong>Team</strong></a> ·
  <a href="#hackathon-submission"><strong>Hackathon Submission</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- **Blockchain Transaction Analysis**
  - Cross-chain transaction tracking and visualization
  - Anomaly detection in transaction patterns
  - Address clustering and entity identification
  
- **AI-Powered Forensics**
  - Natural language querying of blockchain data
  - Automated report generation
  - Pattern recognition across multiple chains
  
- **Technical Stack**
  - [Next.js](https://nextjs.org) App Router
    - Advanced routing for seamless navigation and performance
    - React Server Components (RSCs) and Server Actions for server-side rendering
  - [AI SDK](https://sdk.vercel.ai/docs)
    - Unified API for generating text, structured objects, and tool calls with LLMs
    - Hooks for building dynamic chat and generative user interfaces
  - [shadcn/ui](https://ui.shadcn.com)
    - Styling with [Tailwind CSS](https://tailwindcss.com)
    - Component primitives from [Radix UI](https://radix-ui.com)
  - Data Persistence
    - [Vercel Postgres powered by Neon](https://vercel.com/storage/postgres) for saving analysis history
    - [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage
  - [NextAuth.js](https://github.com/nextauthjs/next-auth)
    - Simple and secure authentication

## Team

- **Dhruv Malik** - [GitHub: @dhruvmalik007](https://github.com/dhruvmalik007)
  - Architecture design and AI integration
  - Blockchain data processing pipeline

- **Mohammed Hassen** - [GitHub: @mwdacem](https://github.com/mwdacem)
  - Frontend development and UX design
  - Cross-chain API integration

## Hackathon Submission

This project is our submission for the ETHSF Hackathon 2025.

### Prize Categories

| Project Name | Prize Amount | Category | Status |
|--------------|--------------|-----------|--------|
| **Coinbase Developer Platform** | $5,000 | Development Tools | ✅ Submitted |
| **Base** | $5,000 | Layer 2 Solutions | ✅ Submitted |
| **Reactive Network** | $10,000 | Network Infrastructure | ✅ Submitted |
| **ZetaChain** | $5,000 | Cross-Chain Solutions | ✅ Submitted |
| **Self Protocol by Celo** | $4,000 | Identity & Privacy | ✅ Submitted |

### Overall Prize Pool
- **Cash Prizes**: $29,006
- **ETH Rewards**: 6 ETH

## Model Providers

This project uses OpenAI `gpt-4o` as the default model for natural language processing and blockchain analysis. With the [AI SDK](https://sdk.vercel.ai/docs), you can switch LLM providers to [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), and [many more](https://sdk.vercel.ai/providers/ai-sdk-providers) with just a few lines of code.

## Deploy Your Own

You can deploy your own version of the Web3 Forensics Agent to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdhruvmalik007%2Fweb3-forensics&env=AUTH_SECRET,OPENAI_API_KEY&envDescription=Learn%20more%20about%20how%20to%20get%20the%20API%20Keys%20for%20the%20application&envLink=https%3A%2F%2Fgithub.com%2Fdhruvmalik007%2Fweb3-forensics%2Fblob%2Fmain%2F.env.example&demo-title=Web3%20Forensics&demo-description=An%20AI-Powered%20Blockchain%20Forensics%20Tool%20Built%20With%20Next.js%20and%20the%20AI%20SDK&demo-url=https%3A%2F%2Fweb3-forensics.vercel.app&stores=[{%22type%22:%22postgres%22},{%22type%22:%22blob%22}])

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run the Web3 Forensics Agent. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various API keys and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your app should now be running on [localhost:3000](http://localhost:3000/).

## Project Checklist

- [x] Cross-chain transaction tracking implementation
- [x] AI agent integration for natural language queries
- [x] Frontend UI/UX design and implementation
- [x] Backend API integration with multiple blockchain explorers
- [x] Authentication and user management
- [x] Deployment pipeline setup
- [x] Documentation
- [x] Submission to all prize categories
