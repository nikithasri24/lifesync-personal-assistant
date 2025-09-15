import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Search,
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  Home,
  Settings,
  Trash2,
  Star,
  Share,
  MoreHorizontal,
  Type,
  Hash,
  List,
  CheckSquare,
  Image,
  Quote,
  Code,
  Divide,
  Calendar,
  Copy,
  ExternalLink,
  Archive,
  Clock,
  Filter,
  SortAsc,
  Grid,
  Database,
  Table,
  BarChart,
  BookOpen,
  Palette,
  Eye,
  EyeOff,
  GripVertical,
  Move,
  X
} from 'lucide-react';
import { format } from 'date-fns';

interface Page {
  id: string;
  title: string;
  content: Block[];
  parentId?: string;
  isExpanded?: boolean;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
  isFavorite?: boolean;
  isArchived?: boolean;
  template?: string;
  cover?: string;
}

interface Block {
  id: string;
  type: 'text' | 'heading1' | 'heading2' | 'heading3' | 'bullet' | 'numbered' | 'todo' | 'quote' | 'code' | 'divider' | 'table' | 'image' | 'callout' | 'toggle';
  content: string;
  completed?: boolean;
  isToggled?: boolean;
  style?: {
    backgroundColor?: string;
    textColor?: string;
    emoji?: string;
  };
  tableData?: {
    headers: string[];
    rows: string[][];
  };
}

interface SlashCommand {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  blockType: Block['type'];
  keywords: string[];
}

export default function Notes() {
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 });
  const [slashMenuBlockId, setSlashMenuBlockId] = useState<string | null>(null);
  const [slashMenuFilter, setSlashMenuFilter] = useState('');
  const [recentPages, setRecentPages] = useState<string[]>([]);
  const [showPageMenu, setShowPageMenu] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ type: 'page' | 'block'; id: string } | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeView, setActiveView] = useState<'all' | 'favorites' | 'recent' | 'archived'>('all');

  // Slash commands configuration
  const slashCommands: SlashCommand[] = [
    { id: 'text', title: 'Text', description: 'Just start writing with plain text', icon: Type, blockType: 'text', keywords: ['text', 'paragraph', 'plain'] },
    { id: 'h1', title: 'Heading 1', description: 'Big section heading', icon: Hash, blockType: 'heading1', keywords: ['h1', 'heading', 'title', 'big'] },
    { id: 'h2', title: 'Heading 2', description: 'Medium section heading', icon: Hash, blockType: 'heading2', keywords: ['h2', 'heading', 'subtitle'] },
    { id: 'h3', title: 'Heading 3', description: 'Small section heading', icon: Hash, blockType: 'heading3', keywords: ['h3', 'heading', 'small'] },
    { id: 'bullet', title: 'Bulleted list', description: 'Create a simple bulleted list', icon: List, blockType: 'bullet', keywords: ['bullet', 'list', 'ul', 'unordered'] },
    { id: 'numbered', title: 'Numbered list', description: 'Create a list with numbering', icon: List, blockType: 'numbered', keywords: ['numbered', 'list', 'ol', 'ordered', 'number'] },
    { id: 'todo', title: 'To-do list', description: 'Track tasks with a to-do list', icon: CheckSquare, blockType: 'todo', keywords: ['todo', 'task', 'check', 'checkbox'] },
    { id: 'quote', title: 'Quote', description: 'Capture a quote', icon: Quote, blockType: 'quote', keywords: ['quote', 'blockquote', 'citation'] },
    { id: 'code', title: 'Code', description: 'Capture a code snippet', icon: Code, blockType: 'code', keywords: ['code', 'snippet', 'programming'] },
    { id: 'divider', title: 'Divider', description: 'Visually divide blocks', icon: Divide, blockType: 'divider', keywords: ['divider', 'separator', 'line', 'hr'] },
    { id: 'callout', title: 'Callout', description: 'Make writing stand out', icon: BookOpen, blockType: 'callout', keywords: ['callout', 'highlight', 'note', 'warning'] },
    { id: 'toggle', title: 'Toggle list', description: 'Hide and show content inside', icon: ChevronRight, blockType: 'toggle', keywords: ['toggle', 'collapse', 'expand', 'dropdown'] },
    { id: 'table', title: 'Table', description: 'Add a table', icon: Table, blockType: 'table', keywords: ['table', 'grid', 'rows', 'columns'] },
  ];

  // Templates
  const templates = [
    { id: 'meeting', name: 'Meeting Notes', icon: '📝', description: 'Template for meeting notes' },
    { id: 'project', name: 'Project Plan', icon: '📋', description: 'Template for project planning' },
    { id: 'journal', name: 'Daily Journal', icon: '📖', description: 'Template for daily journaling' },
    { id: 'research', name: 'Research Notes', icon: '🔬', description: 'Template for research documentation' },
    { id: 'goals', name: 'Goals & OKRs', icon: '🎯', description: 'Template for goal setting' },
  ];

  // Mock data
  const [pages, setPages] = useState<Page[]>([
    {
      id: '1',
      title: 'Getting Started',
      content: [
        { id: 'b1', type: 'heading1', content: 'Welcome to Your Workspace' },
        { id: 'b2', type: 'text', content: 'This is your personal knowledge base. Start by creating pages, adding content, and organizing your thoughts.' },
        { id: 'b3', type: 'heading2', content: 'Quick Tips' },
        { id: 'b4', type: 'bullet', content: 'Type "/" to see all block types' },
        { id: 'b5', type: 'bullet', content: 'Use Cmd/Ctrl + K to quickly search' },
        { id: 'b6', type: 'bullet', content: 'Drag pages to reorganize them' },
        { id: 'b7', type: 'todo', content: 'Complete your first task', completed: false },
        { id: 'b8', type: 'quote', content: '"The best way to organize your thoughts is to write them down."' },
      ],
      icon: '🚀',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: 'Project Ideas',
      content: [
        { id: 'b9', type: 'heading1', content: 'Brainstorm' },
        { id: 'b10', type: 'text', content: 'Collection of project ideas and thoughts...' }
      ],
      icon: '💡',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date()
    },
    {
      id: '3',
      title: 'Meeting Notes',
      content: [],
      parentId: '2',
      icon: '📝',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date()
    }
  ]);

  // Add recent pages tracking
  const addToRecent = (pageId: string) => {
    setRecentPages(prev => {
      const filtered = prev.filter(id => id !== pageId);
      return [pageId, ...filtered].slice(0, 10);
    });
  };

  const currentPage = pages.find(p => p.id === currentPageId) || pages[0];
  
  // Filter pages based on active view
  const getFilteredPages = () => {
    let filtered = pages.filter(p => !p.parentId);
    
    switch (activeView) {
      case 'favorites':
        return filtered.filter(p => p.isFavorite);
      case 'recent':
        return filtered.filter(p => recentPages.includes(p.id)).sort((a, b) => {
          return recentPages.indexOf(a.id) - recentPages.indexOf(b.id);
        });
      case 'archived':
        return filtered.filter(p => p.isArchived);
      default:
        return filtered.filter(p => !p.isArchived);
    }
  };

  const rootPages = getFilteredPages();

  const addNewPage = (parentId?: string, template?: string) => {
    let content: Block[] = [{ id: Date.now().toString(), type: 'text', content: '' }];
    let title = 'Untitled';
    let icon = '📄';

    // Apply template
    if (template) {
      switch (template) {
        case 'meeting':
          title = 'Meeting Notes';
          icon = '📝';
          content = [
            { id: 'b1', type: 'heading1', content: 'Meeting Notes' },
            { id: 'b2', type: 'text', content: `Date: ${format(new Date(), 'MMMM d, yyyy')}` },
            { id: 'b3', type: 'text', content: 'Attendees: ' },
            { id: 'b4', type: 'heading2', content: 'Agenda' },
            { id: 'b5', type: 'bullet', content: '' },
            { id: 'b6', type: 'heading2', content: 'Notes' },
            { id: 'b7', type: 'text', content: '' },
            { id: 'b8', type: 'heading2', content: 'Action Items' },
            { id: 'b9', type: 'todo', content: '', completed: false },
          ];
          break;
        case 'project':
          title = 'Project Plan';
          icon = '📋';
          content = [
            { id: 'b1', type: 'heading1', content: 'Project Plan' },
            { id: 'b2', type: 'heading2', content: 'Overview' },
            { id: 'b3', type: 'text', content: '' },
            { id: 'b4', type: 'heading2', content: 'Goals' },
            { id: 'b5', type: 'bullet', content: '' },
            { id: 'b6', type: 'heading2', content: 'Timeline' },
            { id: 'b7', type: 'text', content: '' },
            { id: 'b8', type: 'heading2', content: 'Resources' },
            { id: 'b9', type: 'bullet', content: '' },
          ];
          break;
        case 'journal':
          title = 'Daily Journal';
          icon = '📖';
          content = [
            { id: 'b1', type: 'heading1', content: format(new Date(), 'EEEE, MMMM d, yyyy') },
            { id: 'b2', type: 'heading2', content: 'How I\'m feeling' },
            { id: 'b3', type: 'text', content: '' },
            { id: 'b4', type: 'heading2', content: 'What happened today' },
            { id: 'b5', type: 'text', content: '' },
            { id: 'b6', type: 'heading2', content: 'What I\'m grateful for' },
            { id: 'b7', type: 'bullet', content: '' },
          ];
          break;
      }
    }

    const newPage: Page = {
      id: Date.now().toString(),
      title,
      content,
      parentId,
      icon,
      createdAt: new Date(),
      updatedAt: new Date(),
      template
    };
    setPages([...pages, newPage]);
    setCurrentPageId(newPage.id);
    addToRecent(newPage.id);
  };

  const updatePageTitle = (pageId: string, title: string) => {
    setPages(pages.map(p => 
      p.id === pageId 
        ? { ...p, title, updatedAt: new Date() }
        : p
    ));
  };

  const toggleFavorite = (pageId: string) => {
    setPages(pages.map(p => 
      p.id === pageId 
        ? { ...p, isFavorite: !p.isFavorite, updatedAt: new Date() }
        : p
    ));
  };

  const archivePage = (pageId: string) => {
    setPages(pages.map(p => 
      p.id === pageId 
        ? { ...p, isArchived: !p.isArchived, updatedAt: new Date() }
        : p
    ));
  };

  const duplicatePage = (pageId: string) => {
    const originalPage = pages.find(p => p.id === pageId);
    if (originalPage) {
      const newPage: Page = {
        ...originalPage,
        id: Date.now().toString(),
        title: `${originalPage.title} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        content: originalPage.content.map(block => ({
          ...block,
          id: Date.now().toString() + Math.random()
        }))
      };
      setPages([...pages, newPage]);
      setCurrentPageId(newPage.id);
    }
  };

  const addBlock = (pageId: string, type: Block['type'] = 'text', afterBlockId?: string) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: '',
      ...(type === 'table' && {
        tableData: {
          headers: ['Column 1', 'Column 2'],
          rows: [['', '']]
        }
      }),
      ...(type === 'callout' && {
        style: {
          backgroundColor: '#f3f4f6',
          emoji: '💡'
        }
      }),
      ...(type === 'toggle' && {
        isToggled: false
      })
    };

    setPages(pages.map(p => {
      if (p.id === pageId) {
        let newContent;
        if (afterBlockId) {
          const index = p.content.findIndex(b => b.id === afterBlockId);
          newContent = [
            ...p.content.slice(0, index + 1),
            newBlock,
            ...p.content.slice(index + 1)
          ];
        } else {
          newContent = [...p.content, newBlock];
        }
        return { ...p, content: newContent, updatedAt: new Date() };
      }
      return p;
    }));

    return newBlock.id;
  };

  const updateBlock = (pageId: string, blockId: string, content: string) => {
    setPages(pages.map(p => {
      if (p.id === pageId) {
        return {
          ...p,
          content: p.content.map(b => 
            b.id === blockId ? { ...b, content } : b
          ),
          updatedAt: new Date()
        };
      }
      return p;
    }));
  };

  const deleteBlock = (pageId: string, blockId: string) => {
    setPages(pages.map(p => {
      if (p.id === pageId) {
        return {
          ...p,
          content: p.content.filter(b => b.id !== blockId),
          updatedAt: new Date()
        };
      }
      return p;
    }));
  };

  const renderPageTree = (pageList: Page[], level = 0) => {
    return pageList.map(page => {
      const childPages = pages.filter(p => p.parentId === page.id);
      const hasChildren = childPages.length > 0;

      return (
        <div key={page.id}>
          <div 
            className={`flex items-center space-x-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${
              currentPageId === page.id ? 'bg-gray-100 dark:bg-slate-700' : ''
            }`}
            style={{ paddingLeft: `${8 + level * 16}px` }}
            onClick={() => {
              setCurrentPageId(page.id);
              addToRecent(page.id);
            }}
          >
            {hasChildren && (
              <button className="p-0.5 hover:bg-gray-200 dark:hover:bg-slate-600 rounded">
                {page.isExpanded ? (
                  <ChevronDown size={14} className="text-gray-500" />
                ) : (
                  <ChevronRight size={14} className="text-gray-500" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-5" />}
            <span className="text-sm">{page.icon}</span>
            <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
              {page.title}
            </span>
            {page.isFavorite && (
              <Star size={12} className="text-yellow-500 fill-current" />
            )}
            <div className="flex items-center opacity-0 group-hover:opacity-100">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  addNewPage(page.id);
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded"
              >
                <Plus size={12} className="text-gray-500" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPageMenu(showPageMenu === page.id ? null : page.id);
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded"
              >
                <MoreHorizontal size={12} className="text-gray-500" />
              </button>
            </div>
          </div>
          {hasChildren && page.isExpanded && (
            <div>
              {renderPageTree(childPages, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const BlockEditor = ({ block, pageId }: { block: Block; pageId: string }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(block.content);

    // Sync content with block content when block changes
    useEffect(() => {
      setContent(block.content);
    }, [block.content]);

    // Auto-focus when editing starts
    useEffect(() => {
      if (isEditing) {
        setTimeout(() => {
          const input = document.querySelector(`[data-block-id="${block.id}"]`) as HTMLInputElement;
          if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length); // Put cursor at end
          }
        }, 0);
      }
    }, [isEditing, block.id]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        updateBlock(pageId, block.id, content);
        const newBlockId = addBlock(pageId, 'text', block.id);
        setIsEditing(false);
        // Focus the new block
        setTimeout(() => {
          const newElement = document.querySelector(`[data-block-id="${newBlockId}"]`) as HTMLElement;
          newElement?.focus();
        }, 0);
      } else if (e.key === 'Backspace' && content === '' && block.type !== 'text') {
        e.preventDefault();
        deleteBlock(pageId, block.id);
      } else if (e.key === '/' && content === '') {
        e.preventDefault();
        setContent('/');
        setShowSlashMenu(true);
        setSlashMenuBlockId(block.id);
        setSlashMenuFilter('');
        const rect = e.currentTarget.getBoundingClientRect();
        setSlashMenuPosition({ x: rect.left, y: rect.bottom + 8 });
      } else if (e.key === 'Escape' && showSlashMenu && slashMenuBlockId === block.id) {
        e.preventDefault();
        setShowSlashMenu(false);
        setSlashMenuBlockId(null);
        setSlashMenuFilter('');
        setContent('');
      } else if (e.key === 'Enter' && showSlashMenu && slashMenuBlockId === block.id) {
        e.preventDefault();
        // Select the first filtered command
        const filteredCommands = slashCommands.filter(command => {
          if (!slashMenuFilter) return true;
          return command.title.toLowerCase().includes(slashMenuFilter) ||
                 command.keywords.some(keyword => keyword.includes(slashMenuFilter));
        });
        
        if (filteredCommands.length > 0) {
          const command = filteredCommands[0];
          setPages(pages.map(p => {
            if (p.id === pageId) {
              return {
                ...p,
                content: p.content.map(b => 
                  b.id === block.id 
                    ? { 
                        ...b, 
                        type: command.blockType,
                        content: '',
                        ...(command.blockType === 'table' && {
                          tableData: {
                            headers: ['Column 1', 'Column 2'],
                            rows: [['', '']]
                          }
                        }),
                        ...(command.blockType === 'callout' && {
                          style: {
                            backgroundColor: '#f3f4f6',
                            emoji: '💡'
                          }
                        }),
                        ...(command.blockType === 'toggle' && {
                          isToggled: false
                        })
                      } 
                    : b
                )
              };
            }
            return p;
          }));
          setShowSlashMenu(false);
          setSlashMenuBlockId(null);
          setSlashMenuFilter('');
        }
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newContent = e.target.value;
      setContent(newContent);
      
      // Show slash menu when typing "/"
      if (newContent === '/') {
        setShowSlashMenu(true);
        setSlashMenuBlockId(block.id);
        setSlashMenuFilter('');
        const rect = e.currentTarget.getBoundingClientRect();
        setSlashMenuPosition({ 
          x: rect.left, 
          y: rect.bottom + 8 
        });
      } else if (newContent.startsWith('/') && newContent.length > 1) {
        // Update filter for slash menu
        const filter = newContent.slice(1).toLowerCase();
        setSlashMenuFilter(filter);
        if (!showSlashMenu) {
          setShowSlashMenu(true);
          setSlashMenuBlockId(block.id);
          const rect = e.currentTarget.getBoundingClientRect();
          setSlashMenuPosition({ 
            x: rect.left, 
            y: rect.bottom + 8 
          });
        }
      } else if (!newContent.startsWith('/') && showSlashMenu && slashMenuBlockId === block.id) {
        setShowSlashMenu(false);
        setSlashMenuBlockId(null);
        setSlashMenuFilter('');
      }
    };

    const getPlaceholder = () => {
      switch (block.type) {
        case 'heading1': return 'Heading 1';
        case 'heading2': return 'Heading 2';
        case 'heading3': return 'Heading 3';
        case 'bullet': return 'Bulleted list';
        case 'numbered': return 'Numbered list';
        case 'todo': return 'To-do';
        case 'quote': return 'Quote';
        case 'code': return 'Code';
        case 'callout': return 'Callout';
        case 'toggle': return 'Toggle list';
        case 'table': return 'Table';
        default: return "Type '/' to see all block types";
      }
    };

    const getBlockStyles = () => {
      switch (block.type) {
        case 'heading1': return 'text-3xl font-bold text-gray-900 dark:text-white';
        case 'heading2': return 'text-2xl font-semibold text-gray-900 dark:text-white';
        case 'heading3': return 'text-xl font-medium text-gray-900 dark:text-white';
        case 'bullet': return 'text-gray-800 dark:text-gray-200';
        case 'numbered': return 'text-gray-800 dark:text-gray-200';
        case 'todo': return 'text-gray-800 dark:text-gray-200';
        case 'quote': return 'text-gray-700 dark:text-gray-300 italic border-l-4 border-gray-300 pl-4';
        case 'code': return 'font-mono text-sm bg-gray-100 dark:bg-slate-800 p-2 rounded';
        case 'callout': return `text-gray-800 dark:text-gray-200 p-3 rounded-md ${block.style?.backgroundColor ? '' : 'bg-blue-50 dark:bg-blue-900/20'}`;
        case 'toggle': return 'text-gray-800 dark:text-gray-200';
        default: return 'text-gray-800 dark:text-gray-200';
      }
    };

    const renderBlockPrefix = () => {
      switch (block.type) {
        case 'bullet':
          return <span className="text-gray-400 mr-2">•</span>;
        case 'numbered':
          return <span className="text-gray-400 mr-2">1.</span>;
        case 'todo':
          return (
            <input 
              type="checkbox" 
              checked={block.completed || false}
              onChange={() => {
                setPages(pages.map(p => {
                  if (p.id === pageId) {
                    return {
                      ...p,
                      content: p.content.map(b => 
                        b.id === block.id ? { ...b, completed: !b.completed } : b
                      )
                    };
                  }
                  return p;
                }));
              }}
              className="mr-2 mt-1"
            />
          );
        case 'callout':
          return (
            <span className="mr-2 text-lg">{block.style?.emoji || '💡'}</span>
          );
        case 'toggle':
          return (
            <button
              onClick={() => {
                setPages(pages.map(p => {
                  if (p.id === pageId) {
                    return {
                      ...p,
                      content: p.content.map(b => 
                        b.id === block.id ? { ...b, isToggled: !b.isToggled } : b
                      )
                    };
                  }
                  return p;
                }));
              }}
              className="mr-2 p-1 hover:bg-gray-100 rounded"
            >
              {block.isToggled ? (
                <ChevronDown size={14} className="text-gray-600" />
              ) : (
                <ChevronRight size={14} className="text-gray-600" />
              )}
            </button>
          );
        default:
          return null;
      }
    };

    if (block.type === 'divider') {
      return (
        <div className="my-4">
          <hr className="border-gray-200 dark:border-slate-600" />
        </div>
      );
    }

    if (block.type === 'table' && block.tableData) {
      return (
        <div className="my-2">
          <div className="border border-gray-200 dark:border-slate-600 rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  {block.tableData.headers.map((header, index) => (
                    <th key={index} className="px-3 py-2 text-left text-sm font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-slate-600 last:border-r-0">
                      <input
                        type="text"
                        value={header}
                        onChange={(e) => {
                          const newHeaders = [...block.tableData!.headers];
                          newHeaders[index] = e.target.value;
                          setPages(pages.map(p => {
                            if (p.id === pageId) {
                              return {
                                ...p,
                                content: p.content.map(b => 
                                  b.id === block.id ? { 
                                    ...b, 
                                    tableData: { ...b.tableData!, headers: newHeaders }
                                  } : b
                                )
                              };
                            }
                            return p;
                          }));
                        }}
                        className="w-full bg-transparent border-none outline-none text-sm font-medium"
                        placeholder="Column name"
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.tableData.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-2 border-r border-gray-200 dark:border-slate-600 last:border-r-0">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => {
                            const newRows = [...block.tableData!.rows];
                            newRows[rowIndex][cellIndex] = e.target.value;
                            setPages(pages.map(p => {
                              if (p.id === pageId) {
                                return {
                                  ...p,
                                  content: p.content.map(b => 
                                    b.id === block.id ? { 
                                      ...b, 
                                      tableData: { ...b.tableData!, rows: newRows }
                                    } : b
                                  )
                                };
                              }
                              return p;
                            }));
                          }}
                          className="w-full bg-transparent border-none outline-none text-sm"
                          placeholder="Empty"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-start space-x-2 py-1 group">
        {renderBlockPrefix()}
        <div className="flex-1">
          {isEditing ? (
            <input
              data-block-id={block.id}
              type="text"
              value={content}
              onChange={handleInputChange}
              onBlur={() => {
                // Don't update if slash menu is open
                if (!showSlashMenu || slashMenuBlockId !== block.id) {
                  updateBlock(pageId, block.id, content);
                  setIsEditing(false);
                }
              }}
              onKeyDown={handleKeyDown}
              className={`w-full bg-transparent border-none outline-none ${getBlockStyles()}`}
              placeholder={getPlaceholder()}
            />
          ) : (
            <div
              onClick={() => {
                setIsEditing(true);
              }}
              className={`w-full cursor-text min-h-6 ${getBlockStyles()} ${!block.content ? 'text-gray-400' : ''}`}
            >
              {block.content || getPlaceholder()}
            </div>
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
          <button
            onClick={() => addBlock(pageId, 'text', block.id)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded"
          >
            <Plus size={14} className="text-gray-400" />
          </button>
          <button
            onClick={() => deleteBlock(pageId, block.id)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded"
          >
            <Trash2 size={14} className="text-gray-400" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-white dark:bg-slate-900 flex">
      {/* Sidebar */}
      <div 
        className="bg-gray-50 dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col"
        style={{ width: sidebarWidth }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900 dark:text-white">Notion</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Personal Workspace</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="px-3 pb-3">
          <div className="space-y-1">
            <button 
              onClick={() => setActiveView('all')}
              className={`w-full flex items-center space-x-3 px-2 py-1.5 text-sm transition-colors rounded-md ${
                activeView === 'all' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              <Home size={16} />
              <span>All Pages</span>
            </button>
            <button 
              onClick={() => setActiveView('favorites')}
              className={`w-full flex items-center space-x-3 px-2 py-1.5 text-sm transition-colors rounded-md ${
                activeView === 'favorites'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              <Star size={16} />
              <span>Favorites</span>
              <span className="ml-auto text-xs bg-gray-200 dark:bg-slate-600 px-2 py-0.5 rounded-full">
                {pages.filter(p => p.isFavorite && !p.isArchived).length}
              </span>
            </button>
            <button 
              onClick={() => setActiveView('recent')}
              className={`w-full flex items-center space-x-3 px-2 py-1.5 text-sm transition-colors rounded-md ${
                activeView === 'recent'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              <Clock size={16} />
              <span>Recent</span>
            </button>
            <button 
              onClick={() => setShowTemplates(true)}
              className="w-full flex items-center space-x-3 px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
            >
              <BookOpen size={16} />
              <span>Templates</span>
            </button>
            <button 
              onClick={() => setActiveView('archived')}
              className={`w-full flex items-center space-x-3 px-2 py-1.5 text-sm transition-colors rounded-md ${
                activeView === 'archived'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              <Archive size={16} />
              <span>Archived</span>
              <span className="ml-auto text-xs bg-gray-200 dark:bg-slate-600 px-2 py-0.5 rounded-full">
                {pages.filter(p => p.isArchived).length}
              </span>
            </button>
          </div>
        </div>

        {/* Pages */}
        <div className="flex-1 px-3 pb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pages</h3>
            <button 
              onClick={() => addNewPage()}
              className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded"
            >
              <Plus size={14} className="text-gray-400" />
            </button>
          </div>
          <div className="space-y-1 group">
            {renderPageTree(rootPages)}
          </div>
        </div>

        {/* Settings */}
        <div className="p-3 border-t border-gray-200 dark:border-slate-700">
          <button className="w-full flex items-center space-x-3 px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors">
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Resize Handle */}
      <div 
        className="w-1 bg-gray-200 dark:bg-slate-700 cursor-col-resize hover:bg-blue-500 transition-colors"
        onMouseDown={(e) => {
          const startX = e.clientX;
          const startWidth = sidebarWidth;

          const handleMouseMove = (e: MouseEvent) => {
            const newWidth = Math.max(200, Math.min(400, startWidth + (e.clientX - startX)));
            setSidebarWidth(newWidth);
          };

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Page Header */}
        {currentPage && (
          <div className="border-b border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{currentPage.icon}</span>
                <input
                  type="text"
                  value={currentPage.title}
                  onChange={(e) => updatePageTitle(currentPage.id, e.target.value)}
                  className="text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none"
                  placeholder="Untitled"
                />
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors">
                  <Share size={18} className="text-gray-600 dark:text-gray-400" />
                </button>
                <button 
                  onClick={() => toggleFavorite(currentPage.id)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                >
                  <Star 
                    size={18} 
                    className={`${currentPage.isFavorite 
                      ? 'text-yellow-500 fill-current' 
                      : 'text-gray-600 dark:text-gray-400'
                    }`} 
                  />
                </button>
                <button 
                  onClick={() => setShowPageMenu(showPageMenu === currentPage.id ? null : currentPage.id)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                >
                  <MoreHorizontal size={18} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span>Last edited {format(currentPage.updatedAt, 'MMM d, yyyy')}</span>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {currentPage ? (
            <div className="max-w-4xl mx-auto p-6">
              <div className="space-y-2">
                {currentPage.content.map((block) => (
                  <BlockEditor key={block.id} block={block} pageId={currentPage.id} />
                ))}
                {currentPage.content.length === 0 && (
                  <div 
                    onClick={() => addBlock(currentPage.id)}
                    className="cursor-text text-gray-400 py-4 hover:text-gray-500 transition-colors"
                  >
                    Start writing or type '/' to see all block types...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No page selected
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Select a page from the sidebar or create a new one
                </p>
                <button 
                  onClick={() => addNewPage()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Page
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slash Commands Menu */}
      {showSlashMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowSlashMenu(false)}
          />
          <div 
            className="fixed z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg w-80 max-h-80 overflow-y-auto"
            style={{ 
              left: Math.max(20, Math.min(slashMenuPosition.x, window.innerWidth - 340)), 
              top: Math.max(20, Math.min(slashMenuPosition.y, window.innerHeight - 340))
            }}
          >
            <div className="p-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-2 px-2">
                {slashMenuFilter ? `Blocks matching "${slashMenuFilter}"` : 'Basic Blocks'}
              </div>
              {slashCommands
                .filter(command => {
                  if (!slashMenuFilter) return true;
                  return command.title.toLowerCase().includes(slashMenuFilter) ||
                         command.keywords.some(keyword => keyword.includes(slashMenuFilter));
                })
                .slice(0, 8) // Limit to 8 results for better UX
                .map((command, index) => {
                  const Icon = command.icon;
                  return (
                    <button
                      key={command.id}
                      onClick={() => {
                        if (slashMenuBlockId) {
                          // Convert the existing block to the selected type
                          setPages(pages.map(p => {
                            if (p.id === currentPage?.id) {
                              return {
                                ...p,
                                content: p.content.map(b => 
                                  b.id === slashMenuBlockId 
                                    ? { 
                                        ...b, 
                                        type: command.blockType,
                                        content: '',
                                        ...(command.blockType === 'table' && {
                                          tableData: {
                                            headers: ['Column 1', 'Column 2'],
                                            rows: [['', '']]
                                          }
                                        }),
                                        ...(command.blockType === 'callout' && {
                                          style: {
                                            backgroundColor: '#f3f4f6',
                                            emoji: '💡'
                                          }
                                        }),
                                        ...(command.blockType === 'toggle' && {
                                          isToggled: false
                                        })
                                      } 
                                    : b
                                )
                              };
                            }
                            return p;
                          }));
                        }
                        setShowSlashMenu(false);
                        setSlashMenuBlockId(null);
                        setSlashMenuFilter('');
                      }}
                      className={`w-full flex items-center space-x-3 px-2 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors text-left ${
                        index === 0 && slashMenuFilter ? 'bg-gray-50 dark:bg-slate-700' : ''
                      }`}
                    >
                      <Icon size={16} className="text-gray-600 dark:text-gray-400" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {command.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {command.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              {slashCommands.filter(command => {
                if (!slashMenuFilter) return false;
                return command.title.toLowerCase().includes(slashMenuFilter) ||
                       command.keywords.some(keyword => keyword.includes(slashMenuFilter));
              }).length === 0 && slashMenuFilter && (
                <div className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No blocks found matching "{slashMenuFilter}"
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Choose a Template
                </h3>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      addNewPage(undefined, template.id);
                      setShowTemplates(false);
                    }}
                    className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
                  >
                    <span className="text-2xl">{template.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white mb-1">
                        {template.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {template.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Context Menu */}
      {showPageMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowPageMenu(null)}
          />
          <div className="fixed z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg w-48 py-2">
            <button
              onClick={() => {
                if (showPageMenu) {
                  toggleFavorite(showPageMenu);
                  setShowPageMenu(null);
                }
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm text-gray-700 dark:text-gray-300"
            >
              <Star size={14} />
              <span>{pages.find(p => p.id === showPageMenu)?.isFavorite ? 'Remove from favorites' : 'Add to favorites'}</span>
            </button>
            <button
              onClick={() => {
                if (showPageMenu) {
                  duplicatePage(showPageMenu);
                  setShowPageMenu(null);
                }
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm text-gray-700 dark:text-gray-300"
            >
              <Copy size={14} />
              <span>Duplicate</span>
            </button>
            <button
              onClick={() => {
                if (showPageMenu) {
                  archivePage(showPageMenu);
                  setShowPageMenu(null);
                }
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm text-gray-700 dark:text-gray-300"
            >
              <Archive size={14} />
              <span>{pages.find(p => p.id === showPageMenu)?.isArchived ? 'Restore from archive' : 'Archive'}</span>
            </button>
            <div className="border-t border-gray-200 dark:border-slate-600 my-1" />
            <button
              onClick={() => {
                if (showPageMenu && window.confirm('Are you sure you want to delete this page?')) {
                  setPages(pages.filter(p => p.id !== showPageMenu));
                  if (currentPageId === showPageMenu) {
                    setCurrentPageId(null);
                  }
                  setShowPageMenu(null);
                }
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-600 dark:text-red-400"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}