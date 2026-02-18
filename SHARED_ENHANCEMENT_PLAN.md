# Shared Tab Enhancement Plan

## Overview

The Shared tab manages partner connections and displays collaborative activity across all merged mode features. This is the central hub for relationship-based data sharing.

**Current State:**
- Connection management exists in `src/shared/api/connectionsAPI.ts`
- Merged mode implemented in individual features
- Needs dedicated Shared tab/page to aggregate all sharing

**Goal:**
- Match `shared-design-spec.html` exactly
- Central hub for partner management
- Activity feed showing all partner actions
- Permission management UI
- Invitation system

**Why This Matters:**
- Provides visibility into shared collaboration
- Easy permission management
- Activity transparency
- Onboarding for partner connections

---

## Critical Components (from Design Spec)

### 1. Header
- **Title:** "👥 Shared"
- **Subtitle:** "Collaborate with family & friends"
- Terracotta gradient background

### 2. Stats Grid (3 columns)
- **Partner count:** Number of active connections
- **Modules:** Number of shared modules
- **Shared items:** Total items shared across all modules

### 3. Tab Navigation (SegmentedControl)
- **Partner:** View connection details and permissions
- **Invites:** Pending invitations (sent/received) with badge count
- **Activity:** Real-time activity feed

### 4. Partner Tab
- Partner connection card:
  - Avatar (initials with gradient background)
  - Name and email
  - Relationship badge (Spouse, Partner, Friend, Family, Roommate, Colleague)
  - Permission badges showing which modules are shared and mode

### 5. Invites Tab
- Received invitations:
  - Sender info with avatar
  - Relationship type
  - Personal message (optional)
  - Permission summary
  - Accept/Decline buttons
- Sent invitations:
  - Recipient info
  - Status: Pending
  - Cancel option

### 6. Activity Feed Tab
- Chronological list of partner actions:
  - Module icon
  - Action description
  - Actor (You/Partner name)
  - Timestamp (relative)
- Examples:
  - "Added Pasta Carbonara to meal plan"
  - "Checked off Milk from shopping list"
  - "Added transaction: $45.20 at Whole Foods"
  - "Completed task: Buy groceries"

### 7. Invite Partner Form (Empty State)
- Email input (required)
- Name input (optional)
- Personal message textarea (optional)
- Permission toggles per module:
  - Off / Merged (for modules supporting merged mode)
  - Off / View / Edit (for modules supporting view/edit)
- Submit button: "Send Invitation"

### 8. Permission Management
- Per-module permission rows:
  - Module icon
  - Module name
  - Module description
  - Toggle: Off / View / Edit / Merged
- Modules with sharing:
  - 🍽️ Meals (Off/Merged)
  - 🛒 Shopping (Off/Merged)
  - ✓ Tasks (Off/View/Edit)
  - 💰 Finances (Off/View/Edit)
  - 🎯 Habits (Off/View)
  - 🏆 Goals (Off/View)
  - ✈️ Travel (Off/Merged)
  - 📋 Projects (Off/View/Edit/Merged)
  - 📝 Notes (Off/View/Edit)

---

## Database Schema

```sql
-- Connections table (already exists)
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id_1 UUID NOT NULL REFERENCES auth.users(id),
  user_id_2 UUID NOT NULL REFERENCES auth.users(id),
  relationship_type VARCHAR(20), -- 'spouse', 'partner', 'friend', 'family', 'roommate', 'colleague'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'declined', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (user_id_1 < user_id_2) -- Ensure no duplicate pairs
);

-- Connection invitations
CREATE TABLE connection_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(100),
  message TEXT,
  relationship_type VARCHAR(20) NOT NULL,
  permissions JSONB NOT NULL, -- { "meals": "merged", "shopping": "merged", ... }
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

-- Connection permissions (per module)
CREATE TABLE connection_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  module VARCHAR(50) NOT NULL, -- 'meals', 'shopping', 'finance', 'travel', etc.
  permission_mode VARCHAR(20) NOT NULL, -- 'off', 'view', 'edit', 'merged'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id, module)
);

-- Activity log (for activity feed)
CREATE TABLE connection_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  action_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'completed'
  module VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL, -- 'task', 'meal', 'shopping_item', etc.
  resource_id UUID,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_connection_activity_connection ON connection_activity(connection_id, created_at DESC);
```

---

## Implementation Plan

### Phase 1: Create Shared Page Structure

**File:** `src/pages/Shared.tsx`

**Changes:**
1. Centered 900px layout
2. Terracotta gradient header
3. Stats grid (3 columns)
4. SegmentedControl for 3 tabs
5. Conditional rendering based on active tab

```typescript
const Shared: React.FC = () => {
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState<'partner' | 'invites' | 'activity'>('partner');

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '5rem' }}>
        {/* Header */}
        <SharedHeaderV2 stats={stats} />

        {/* Tab Navigation */}
        <div className="px-6 mb-4">
          <SegmentedControlV2
            segments={[
              { value: 'partner', label: 'Partner' },
              { value: 'invites', label: 'Invites', badge: pendingCount },
              { value: 'activity', label: 'Activity' },
            ]}
            value={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'partner' && <PartnerTabV2 />}
        {activeTab === 'invites' && <InvitesTabV2 />}
        {activeTab === 'activity' && <ActivityTabV2 />}

        {/* FAB: Invite Partner */}
        <FABV2 icon={Plus} onClick={openInviteModal} label="Invite Partner" />
      </div>
    </div>
  );
};
```

---

### Phase 2: Create SharedHeaderV2 Component

**File:** `src/shared/components/v2/SharedHeaderV2.tsx`

**Changes:**
```typescript
export const SharedHeaderV2: React.FC<{ stats: SharedStats }> = ({ stats }) => {
  return (
    <div
      className="px-5 py-6 mb-4"
      style={{
        background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
        color: 'white',
      }}
    >
      <h1 className="text-3xl font-bold mb-2">👥 Shared</h1>
      <p className="text-sm opacity-90 mb-4">Collaborate with family & friends</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-3xl font-bold">{stats.partnerCount}</div>
          <div className="text-xs uppercase opacity-90 mt-1">Partner</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold">{stats.modulesShared}</div>
          <div className="text-xs uppercase opacity-90 mt-1">Modules</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold">{stats.itemsShared}</div>
          <div className="text-xs uppercase opacity-90 mt-1">Shared</div>
        </div>
      </div>
    </div>
  );
};
```

---

### Phase 3: Create PartnerTabV2 Component

**File:** `src/shared/components/v2/PartnerTabV2.tsx`

**Changes:**
```typescript
export const PartnerTabV2: React.FC = () => {
  const { data: connection } = usePartnerConnection();
  const { data: permissions } = useConnectionPermissions(connection?.id);

  if (!connection) {
    return <EmptyPartnerState onInvite={openInviteModal} />;
  }

  return (
    <div className="px-6">
      <h2 className="text-lg font-bold mb-3" style={{ color: colors.text.primary }}>
        Partner Connection
      </h2>

      {/* Partner Card */}
      <div
        className="bg-white rounded-2xl p-4 shadow-sm"
        style={{ border: `1px solid ${colors.border.light}` }}
      >
        {/* Header: Avatar + Info + Relationship */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            }}
          >
            {getInitials(connection.partnerName)}
          </div>
          <div className="flex-1">
            <div className="font-bold text-base" style={{ color: colors.text.primary }}>
              {connection.partnerName}
            </div>
            <div className="text-sm" style={{ color: colors.text.secondary }}>
              {connection.partnerEmail}
            </div>
          </div>
          <RelationshipBadge type={connection.relationshipType} />
        </div>

        {/* Permission Badges */}
        <div className="flex flex-wrap gap-2">
          {permissions?.map((perm) => (
            <PermissionBadge
              key={perm.module}
              module={perm.module}
              mode={perm.permissionMode}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t" style={{ borderColor: colors.border.light }}>
          <button
            onClick={openPermissionsModal}
            className="w-full py-2 px-4 rounded-xl font-semibold text-sm"
            style={{
              background: colors.bg.secondary,
              color: colors.text.primary,
            }}
          >
            Manage Permissions
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

### Phase 4: Create InvitesTabV2 Component

**File:** `src/shared/components/v2/InvitesTabV2.tsx`

**Changes:**
```typescript
export const InvitesTabV2: React.FC = () => {
  const { data: receivedInvites } = useReceivedInvitations();
  const { data: sentInvites } = useSentInvitations();
  const acceptInvite = useAcceptInvitation();
  const declineInvite = useDeclineInvitation();

  return (
    <div className="px-6">
      {/* Received Invitations */}
      {receivedInvites && receivedInvites.length > 0 && (
        <>
          <h2 className="text-lg font-bold mb-3">Partner Invitation</h2>
          {receivedInvites.map((invite) => (
            <InvitationCard
              key={invite.id}
              invitation={invite}
              direction="received"
              onAccept={() => acceptInvite.mutate(invite.id)}
              onDecline={() => declineInvite.mutate(invite.id)}
            />
          ))}
        </>
      )}

      {/* Sent Invitations */}
      {sentInvites && sentInvites.length > 0 && (
        <>
          <h2 className="text-lg font-bold mb-3 mt-6">Sent Invitations</h2>
          {sentInvites.map((invite) => (
            <InvitationCard
              key={invite.id}
              invitation={invite}
              direction="sent"
              onCancel={() => cancelInvite.mutate(invite.id)}
            />
          ))}
        </>
      )}

      {/* Empty State */}
      {(!receivedInvites?.length && !sentInvites?.length) && (
        <EmptyInvitesState />
      )}
    </div>
  );
};
```

---

### Phase 5: Create ActivityTabV2 Component

**File:** `src/shared/components/v2/ActivityTabV2.tsx`

**Changes:**
```typescript
export const ActivityTabV2: React.FC = () => {
  const { data: activities, isLoading } = useConnectionActivity();

  if (isLoading) return <LoadingState />;

  if (!activities || activities.length === 0) {
    return <EmptyActivityState />;
  }

  return (
    <div className="px-6">
      <h2 className="text-lg font-bold mb-3">Recent Activity</h2>

      <div className="space-y-3">
        {activities.map((activity) => (
          <ActivityItemV2
            key={activity.id}
            activity={activity}
          />
        ))}
      </div>
    </div>
  );
};

// Activity Item Component
const ActivityItemV2: React.FC<{ activity: Activity }> = ({ activity }) => {
  const colors = useThemeColors();

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ backgroundColor: colors.bg.secondary }}
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
        style={{
          background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
        }}
      >
        {getModuleIcon(activity.module)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold" style={{ color: colors.text.primary }}>
          {activity.description}
        </div>
        <div className="text-xs" style={{ color: colors.text.tertiary }}>
          {activity.actorName} · {getRelativeTime(activity.createdAt)}
        </div>
      </div>
    </div>
  );
};
```

---

### Phase 6: Create InvitePartnerModalV2 Component

**File:** `src/shared/components/v2/InvitePartnerModalV2.tsx`

**Changes:**
Follow Together modal pattern:

```typescript
export const InvitePartnerModalV2: React.FC<Props> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('partner');
  const [permissions, setPermissions] = useState<ModulePermissions>({});

  const sendInvite = useSendInvitation();

  const handleSubmit = async () => {
    if (!email.trim()) {
      showToast('Please enter an email address', 'error');
      return;
    }

    try {
      await sendInvite.mutateAsync({
        recipientEmail: email,
        recipientName: name || null,
        message: message || null,
        relationshipType,
        permissions,
      });
      showToast('Invitation sent! 📧', 'success');
      onClose();
    } catch (error) {
      logger.error('Shared', error as Error, { context: 'Failed to send invitation' });
      showToast('Failed to send invitation', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center lg:items-center" onClick={...}>
      <div className="w-full bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col" style={{ maxHeight: '90vh', maxWidth: '600px' }}>
        {/* Drag Handle */}
        <div className="lg:hidden pt-2 flex-shrink-0">
          <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b flex-shrink-0">
          <h2 className="text-2xl font-bold">Invite Partner</h2>
          <button onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold mb-2">Partner's Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="partner@example.com"
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-terracotta-300"
              required
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-2">Partner's Name (Optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What do you call them?"
              className="w-full px-4 py-3 border rounded-xl"
            />
          </div>

          {/* Relationship Type */}
          <div>
            <label className="block text-sm font-semibold mb-2">Relationship</label>
            <select
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value as RelationshipType)}
              className="w-full px-4 py-3 border rounded-xl"
            >
              <option value="spouse">Spouse</option>
              <option value="partner">Partner</option>
              <option value="friend">Friend</option>
              <option value="family">Family</option>
              <option value="roommate">Roommate</option>
              <option value="colleague">Colleague</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold mb-2">Personal Message (Optional)</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message..."
              className="w-full px-4 py-3 border rounded-xl resize-none"
            />
          </div>

          {/* Permissions Section */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold mb-4">Choose What to Share</h3>
            <PermissionToggles
              permissions={permissions}
              onChange={setPermissions}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3 flex-shrink-0 bg-white">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 rounded-xl font-semibold">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={sendInvite.isPending}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
          >
            {sendInvite.isPending ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

### Phase 7: Create PermissionToggles Component

**File:** `src/shared/components/v2/PermissionToggles.tsx`

**Changes:**
```typescript
const MODULES = [
  { id: 'meals', icon: '🍽️', name: 'Meals', desc: 'Meal planning & recipes', modes: ['off', 'merged'] },
  { id: 'shopping', icon: '🛒', name: 'Shopping', desc: 'Grocery lists', modes: ['off', 'merged'] },
  { id: 'tasks', icon: '✓', name: 'Tasks', desc: 'Todo lists', modes: ['off', 'view', 'edit'] },
  { id: 'finance', icon: '💰', name: 'Finances', desc: 'Accounts & budgets', modes: ['off', 'view', 'edit'] },
  { id: 'habits', icon: '🎯', name: 'Habits', desc: 'Daily habits', modes: ['off', 'view'] },
  { id: 'goals', icon: '🏆', name: 'Goals', desc: 'Life goals & dreams', modes: ['off', 'view'] },
  { id: 'travel', icon: '✈️', name: 'Travel', desc: 'Travel planning', modes: ['off', 'merged'] },
  { id: 'projects', icon: '📋', name: 'Projects', desc: 'Project tracking', modes: ['off', 'view', 'edit', 'merged'] },
  { id: 'notes', icon: '📝', name: 'Notes', desc: 'Note taking', modes: ['off', 'view', 'edit'] },
];

export const PermissionToggles: React.FC<Props> = ({ permissions, onChange }) => {
  return (
    <div className="space-y-3">
      {MODULES.map((module) => (
        <div key={module.id} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-terracotta-100 flex items-center justify-center text-lg">
              {module.icon}
            </div>
            <div>
              <div className="text-sm font-semibold">{module.name}</div>
              <div className="text-xs text-gray-500">{module.desc}</div>
            </div>
          </div>
          <ModulePermissionToggle
            modes={module.modes}
            value={permissions[module.id] || 'off'}
            onChange={(mode) => onChange({ ...permissions, [module.id]: mode })}
          />
        </div>
      ))}
    </div>
  );
};

const ModulePermissionToggle: React.FC<{
  modes: string[];
  value: string;
  onChange: (mode: string) => void;
}> = ({ modes, value, onChange }) => {
  return (
    <div className="flex gap-1 p-1 bg-gray-200 rounded-lg">
      {modes.map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
            value === mode
              ? 'bg-white text-terracotta-600 shadow-sm'
              : 'text-gray-600'
          }`}
        >
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </button>
      ))}
    </div>
  );
};
```

---

### Phase 8: Create React Query Hooks

**File:** `src/shared/hooks/useSharedQuery.ts`

**Changes:**
```typescript
export function usePartnerConnection() {
  return useQuery({
    queryKey: ['shared', 'partner'],
    queryFn: getPartnerConnection,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useConnectionPermissions(connectionId?: string) {
  return useQuery({
    queryKey: ['shared', 'permissions', connectionId],
    queryFn: () => getConnectionPermissions(connectionId!),
    enabled: !!connectionId,
  });
}

export function useReceivedInvitations() {
  return useQuery({
    queryKey: ['shared', 'invitations', 'received'],
    queryFn: getReceivedInvitations,
  });
}

export function useSentInvitations() {
  return useQuery({
    queryKey: ['shared', 'invitations', 'sent'],
    queryFn: getSentInvitations,
  });
}

export function useConnectionActivity() {
  return useQuery({
    queryKey: ['shared', 'activity'],
    queryFn: getConnectionActivity,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useSendInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries(['shared', 'invitations']);
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries(['shared']);
    },
  });
}

export function useUpdatePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateConnectionPermissions,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['shared', 'permissions', variables.connectionId]);
    },
  });
}
```

---

### Phase 9: Activity Logging System

**File:** `src/shared/utils/activityLogger.ts`

**Objective:** Automatically log partner actions to activity feed

**Changes:**
```typescript
export const logActivity = async (params: {
  module: string;
  actionType: 'created' | 'updated' | 'deleted' | 'completed';
  resourceType: string;
  resourceId: string;
  description: string;
  metadata?: Record<string, any>;
}) => {
  const connection = await getPartnerConnection();
  if (!connection) return; // No partner, no logging

  await supabase.from('connection_activity').insert({
    connection_id: connection.id,
    actor_id: (await supabase.auth.getUser()).data.user!.id,
    action_type: params.actionType,
    module: params.module,
    resource_type: params.resourceType,
    resource_id: params.resourceId,
    description: params.description,
    metadata: params.metadata,
  });
};
```

**Integration:** Call from mutation hooks in each feature:
```typescript
// Example in tasks
export function useCreateTask() {
  return useMutation({
    mutationFn: createTask,
    onSuccess: (task) => {
      // ... existing logic
      logActivity({
        module: 'tasks',
        actionType: 'created',
        resourceType: 'task',
        resourceId: task.id,
        description: `Created task: ${task.title}`,
      });
    },
  });
}
```

---

### Phase 10: Code Quality & Verification

**10.1: Error Boundary**
- Add to App.tsx: `<RouteErrorBoundary feature="Shared"><Shared /></RouteErrorBoundary>`

**10.2: Loading States**
- Skeleton for connection card
- Skeleton for activity feed
- Spinner for invitations

**10.3: Empty States**
- No partner: "Invite Your Partner" with FAB
- No invitations: "No pending invitations"
- No activity: "No activity yet"

**10.4: Accessibility**
- All icon buttons have aria-labels
- Form inputs have proper labels
- Keyboard navigation works
- Focus states visible

**10.5: Performance**
- Activity feed auto-refreshes every 30 seconds
- Optimistic updates for permission toggles
- Debounced search/filter (if added)

---

## Success Criteria

✅ Shared page matches `shared-design-spec.html` exactly
✅ Partner connection card displays correctly
✅ Invitation system works (send/accept/decline)
✅ Permission toggles update database
✅ Activity feed shows real-time partner actions
✅ Empty states for all scenarios
✅ React Query for all data fetching
✅ Activity logging integrated into all features
✅ Responsive layout (mobile/desktop)
✅ Accessible (keyboard, screen readers)

---

## Files Summary

### Files to Create (10+)
- `src/pages/Shared.tsx` - Main page
- `src/shared/components/v2/SharedHeaderV2.tsx` - Header with stats
- `src/shared/components/v2/PartnerTabV2.tsx` - Partner view
- `src/shared/components/v2/InvitesTabV2.tsx` - Invitations view
- `src/shared/components/v2/ActivityTabV2.tsx` - Activity feed
- `src/shared/components/v2/InvitePartnerModalV2.tsx` - Invite modal
- `src/shared/components/v2/PermissionToggles.tsx` - Permission UI
- `src/shared/components/v2/InvitationCard.tsx` - Invitation card
- `src/shared/components/v2/PermissionBadge.tsx` - Permission badge
- `src/shared/components/v2/RelationshipBadge.tsx` - Relationship badge
- `src/shared/hooks/useSharedQuery.ts` - React Query hooks
- `src/shared/utils/activityLogger.ts` - Activity logging utility

### Database Migrations
- Add `connection_invitations` table
- Add `connection_permissions` table
- Add `connection_activity` table

### Integration Points
- Integrate `logActivity()` into all feature mutation hooks
- Update all features to check partner connection permissions

---

## Commit Message

```
feat: Create Shared tab for partner collaboration management

Implement Shared feature matching design spec:
- 3 tabs: Partner, Invites, Activity
- Partner connection management with permissions
- Invitation system (send/receive with custom permissions)
- Real-time activity feed showing partner actions
- Per-module permission toggles (Off/View/Edit/Merged)
- Stats: partner count, modules shared, items shared

Features:
- Send partner invitations with email
- Accept/decline invitations
- Manage sharing permissions per module
- View activity feed (30s auto-refresh)
- Relationship types: Spouse, Partner, Friend, Family, Roommate, Colleague
- Activity logging system integrated into all features

Database:
- connection_invitations table
- connection_permissions table
- connection_activity table

Technical:
- React Query for data fetching
- Activity logger utility
- FeatureErrorBoundary
- useThemeColors()
- Together modal pattern
- Auto-refresh activity feed

Files: 12+ created, database migrations

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Estimated Complexity

**High** - Significant feature with multiple subsystems:
- Partner invitation flow
- Permission management system
- Activity logging across all features
- Real-time activity feed
- Database schema additions
- Integration with all existing features

**Risk Level:** Medium
- Requires database migrations
- Needs integration into all feature mutation hooks
- Permission system must be bulletproof for data security
- Activity logging performance considerations

---

## Implementation Notes

### Key Advantages

1. **Centralized Collaboration:**
   - Single place to manage all sharing
   - Clear visibility into partner activity
   - Easy permission changes

2. **Transparency:**
   - Activity feed shows what partner is doing
   - No surprises with shared data changes
   - Builds trust in collaboration

3. **Flexible Permissions:**
   - Per-module granular control
   - Different modes: Off/View/Edit/Merged
   - Can change anytime

### Security Considerations

1. **RLS Policies:**
   - Users can only see their own invitations
   - Activity only visible within connection
   - Permissions enforced at database level

2. **Invitation Expiry:**
   - Invitations expire after 7 days
   - Clean up expired invitations periodically

3. **Permission Validation:**
   - Check permissions before every data access
   - Cache permission checks for performance
   - Invalidate cache on permission changes

### Performance Optimization

1. **Activity Feed:**
   - Limit to last 50 activities
   - Paginate if needed
   - Auto-refresh every 30 seconds (configurable)

2. **Activity Logging:**
   - Async logging (fire-and-forget)
   - Batch insertions if high volume
   - Index on connection_id + created_at

---

## Conclusion

The Shared tab is the central hub for partner collaboration in LifeSync. It provides:

1. **Visibility:** See what your partner is doing
2. **Control:** Manage permissions granularly
3. **Onboarding:** Easy invitation system
4. **Trust:** Transparent activity feed

This feature ties together all merged mode functionality across the app, making collaboration seamless and trustworthy.
