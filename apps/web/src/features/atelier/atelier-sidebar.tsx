import { Link } from '@tanstack/react-router';
import { ClipboardList, Folder, GitBranch, ListChecks, MessageSquare } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { AtelierView } from './atelier-view';

export type AtelierTab = 'conversation' | 'suggestions' | 'diagnostic';

interface AtelierSidebarProps {
  tab: AtelierTab;
  view: AtelierView;
  repoName: string | undefined;
  branch: string | undefined;
}

// Barre latérale de l'atelier : trois vues (changent le search param « vue »), puis le projet.
export function AtelierSidebar({ tab, view, repoName, branch }: AtelierSidebarProps) {
  return (
    <Sidebar collapsible="none" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Atelier</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={tab === 'conversation'}
                  render={<Link to="/atelier" search={{ vue: 'conversation' }} />}
                >
                  <MessageSquare aria-hidden="true" />
                  Conversation
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={tab === 'suggestions'}
                  render={<Link to="/atelier" search={{ vue: 'suggestions' }} />}
                >
                  <ListChecks aria-hidden="true" />
                  Suggestions
                </SidebarMenuButton>
                {view.remaining > 0 && <SidebarMenuBadge>{view.remaining}</SidebarMenuBadge>}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={tab === 'diagnostic'}
                  render={<Link to="/atelier" search={{ vue: 'diagnostic' }} />}
                >
                  <ClipboardList aria-hidden="true" />
                  Diagnostic détaillé
                </SidebarMenuButton>
                {view.blockers > 0 && <SidebarMenuBadge>{view.blockers}</SidebarMenuBadge>}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Projet</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex flex-col gap-1 px-2 py-1.5 text-sm">
                  <span className="flex items-center gap-1.5 font-mono font-medium">
                    <Folder className="size-3.5" aria-hidden="true" />
                    {repoName ?? '…'}
                  </span>
                  {branch && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <GitBranch className="size-3.5" aria-hidden="true" />
                      {branch}
                    </span>
                  )}
                </div>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link to="/contexte" search={{ q: '' }} />}>
                  Voir le contexte
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
