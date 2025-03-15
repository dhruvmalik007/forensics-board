'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Search, 
  MoreHorizontal, 
  Trash2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useBlockchainExploration } from '@/hooks/use-blockchain-exploration';
import { usePrivyAuthWithDB } from '@/hooks/use-privy-auth-with-db';

interface BlockchainExploration {
  id: string;
  userId: string;
  documentId: string;
  query: string;
  address?: string;
  network?: string;
  createdAt: string;
  completedAt?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  results?: any;
}

interface TransactionSessionItemProps {
  exploration: BlockchainExploration;
  isActive: boolean;
  onDelete: (id: string) => void;
  setOpenMobile: (open: boolean) => void;
}

const TransactionSessionItem = ({
  exploration,
  isActive,
  onDelete,
  setOpenMobile,
}: TransactionSessionItemProps) => {
  // Format the date for display
  const formattedDate = format(new Date(exploration.createdAt), 'MMM d, yyyy h:mm a');
  
  // Get status icon based on exploration status
  const StatusIcon = () => {
    switch (exploration.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={`/dashboard?documentId=${exploration.documentId}`} onClick={() => setOpenMobile(false)}>
          <div className="flex flex-col w-full">
            <div className="flex items-center justify-between">
              <span className="font-medium truncate">
                {exploration.address ? `${exploration.address.substring(0, 8)}...` : 'Blockchain Query'}
              </span>
              <StatusIcon />
            </div>
            <div className="flex items-center text-xs text-gray-400 mt-1">
              <span className="truncate">{exploration.network || 'ethereum'}</span>
              <span className="mx-1">•</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </Link>
      </SidebarMenuButton>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5"
            showOnHover={!isActive}
          >
            <MoreHorizontal />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              window.open(`/dashboard?documentId=${exploration.documentId}`, '_blank');
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            <span>Open in new tab</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive"
            onSelect={() => onDelete(exploration.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export function TransactionSessionsSidebar() {
  const { setOpenMobile } = useSidebar();
  const router = useRouter();
  const { user } = usePrivyAuthWithDB();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  
  // Get the blockchain explorations using the hook
  const { explorations, isLoading, getExplorations } = useBlockchainExploration({
    privyDID: user?.id || '',
  });

  // Fetch explorations when the component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      getExplorations();
    }
  }, [user?.id, getExplorations]);
  
  // Get the active document ID from the URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const documentId = url.searchParams.get('documentId');
    setActiveDocumentId(documentId);
  }, []);

  // Handle deletion of an exploration
  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      // Call API to delete the exploration
      const response = await fetch(`/api/blockchain/exploration?id=${deleteId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete exploration');
      }
      
      // Update the local state
      toast.success('Exploration deleted successfully');
      
      // Refresh the explorations list
      getExplorations();
      
      // If the deleted exploration was active, redirect to dashboard
      if (activeDocumentId) {
        const deletedExploration = explorations.find(e => e.id === deleteId);
        if (deletedExploration && deletedExploration.documentId === activeDocumentId) {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      toast.error('Failed to delete exploration');
    } finally {
      setShowDeleteDialog(false);
      setDeleteId(null);
    }
  };

  // Group explorations by date
  const groupExplorationsByDate = () => {
    const today: BlockchainExploration[] = [];
    const yesterday: BlockchainExploration[] = [];
    const older: BlockchainExploration[] = [];
    
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    
    explorations.forEach(exploration => {
      const explorationDate = new Date(exploration.createdAt);
      const explorationDay = new Date(
        explorationDate.getFullYear(),
        explorationDate.getMonth(),
        explorationDate.getDate()
      );
      
      if (explorationDay.getTime() === todayDate.getTime()) {
        today.push(exploration);
      } else if (explorationDay.getTime() === yesterdayDate.getTime()) {
        yesterday.push(exploration);
      } else {
        older.push(exploration);
      }
    });
    
    return { today, yesterday, older };
  };

  // If user is not authenticated or in freemium mode, show a simplified view
  if (!user) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          Blockchain Explorations
        </div>
        <SidebarGroupContent>
          <div className="px-3 py-3 rounded-md bg-blue-900/20 text-blue-400 text-sm mb-3">
            <p>You're in freemium mode. Start your exploration by entering an address in the chat.</p>
          </div>
          <div className="px-3 py-3 rounded-md bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors flex items-center justify-center">
            <Search className="h-4 w-4 mr-2" />
            <span>Search for an Address</span>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          Today
        </div>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[44, 32, 28, 64, 52].map((item, index) => (
              <div
                key={index}
                className="rounded-md h-16 flex gap-2 px-2 items-center my-1"
              >
                <div
                  className="h-full w-full rounded-md flex-1 bg-sidebar-accent-foreground/10"
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (explorations.length === 0) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          Blockchain Explorations
        </div>
        <SidebarGroupContent>
          <div className="px-3 py-3 rounded-md bg-blue-900/20 text-blue-400 text-sm mb-3">
            <p>Enter an address in the chat to start your exploration.</p>
          </div>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2 py-4">
            <Search className="h-4 w-4" />
            <span>No blockchain explorations yet</span>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const { today, yesterday, older } = groupExplorationsByDate();

  return (
    <>
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          Blockchain Explorations
        </div>
        
        {today.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-2">
              Today
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {today.map((exploration) => (
                  <TransactionSessionItem
                    key={exploration.id}
                    exploration={exploration}
                    isActive={exploration.documentId === activeDocumentId}
                    onDelete={(id) => {
                      setDeleteId(id);
                      setShowDeleteDialog(true);
                    }}
                    setOpenMobile={setOpenMobile}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </>
        )}
        
        {yesterday.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-2">
              Yesterday
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {yesterday.map((exploration) => (
                  <TransactionSessionItem
                    key={exploration.id}
                    exploration={exploration}
                    isActive={exploration.documentId === activeDocumentId}
                    onDelete={(id) => {
                      setDeleteId(id);
                      setShowDeleteDialog(true);
                    }}
                    setOpenMobile={setOpenMobile}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </>
        )}
        
        {older.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-2">
              Older
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {older.map((exploration) => (
                  <TransactionSessionItem
                    key={exploration.id}
                    exploration={exploration}
                    isActive={exploration.documentId === activeDocumentId}
                    onDelete={(id) => {
                      setDeleteId(id);
                      setShowDeleteDialog(true);
                    }}
                    setOpenMobile={setOpenMobile}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </>
        )}
      </SidebarGroup>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exploration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this blockchain exploration? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 