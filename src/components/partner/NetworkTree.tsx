import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useI18n } from '../../i18n'

interface DownlineNode {
  id: string
  user_id: string
  display_name: string | null
  email: string | null
  status: string
  level: number
  joined_at: string | null
  parent_partner_id: string | null
}

interface TreeNode extends DownlineNode {
  children: TreeNode[]
  expanded: boolean
}

interface NetworkStats {
  total: number
  active: number
  directPartners: number
  newThisWeek: number
}

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return '??'
}

function maskEmail(email: string | null): string {
  if (!email) return '---'
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  const maskedLocal = local.length > 2
    ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    : '**'
  return `${maskedLocal}@${domain}`
}

function statusColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-green-500'
    case 'suspended': return 'bg-red-500'
    case 'pending': return 'bg-yellow-500'
    default: return 'bg-gray-400'
  }
}

function statusLabel(status: string, t: ReturnType<typeof useI18n>['t']): string {
  switch (status) {
    case 'active': return t.network.statusActive
    case 'suspended': return t.network.statusSuspended
    case 'pending': return t.network.statusPending
    default: return status
  }
}

function buildTree(nodes: DownlineNode[], rootId: string): TreeNode[] {
  const childMap = new Map<string, DownlineNode[]>()
  for (const node of nodes) {
    const parentId = node.parent_partner_id || '__root__'
    const existing = childMap.get(parentId) || []
    existing.push(node)
    childMap.set(parentId, existing)
  }

  function build(parentId: string, depth: number): TreeNode[] {
    const children = childMap.get(parentId) || []
    return children.map(child => ({
      ...child,
      expanded: depth < 2,
      children: build(child.id, depth + 1),
    }))
  }

  return build(rootId, 0)
}

function TreeNodeComponent({ node, onToggle, t }: {
  node: TreeNode
  onToggle: (id: string) => void
  t: ReturnType<typeof useI18n>['t']
}) {
  const hasChildren = node.children.length > 0
  const displayLabel = node.display_name || maskEmail(node.email)

  return (
    <li className="relative pl-6 pt-3">
      {/* Vertical line from parent */}
      <span
        className="absolute left-0 top-0 bottom-0 w-px bg-kraft-border"
        aria-hidden="true"
      />
      {/* Horizontal line to node */}
      <span
        className="absolute left-0 top-[1.625rem] w-6 h-px bg-kraft-border"
        aria-hidden="true"
      />

      <div
        className={`flex items-center gap-3 p-3 rounded-xl border border-kraft-border/40 bg-white shadow-sm ${hasChildren ? 'cursor-pointer hover:border-kraft-accent/50' : ''}`}
        onClick={() => hasChildren && onToggle(node.id)}
        role={hasChildren ? 'button' : undefined}
        aria-expanded={hasChildren ? node.expanded : undefined}
      >
        {/* Avatar */}
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-kraft-accent/15 text-kraft-accent flex items-center justify-center text-xs font-bold">
          {getInitials(node.display_name, node.email)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-kraft-dark truncate">{displayLabel}</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium text-white px-1.5 py-0.5 rounded-full ${statusColor(node.status)}`}>
              {statusLabel(node.status, t)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-kraft-muted mt-0.5">
            <span>{t.network.levelLabel} {node.level}</span>
            {node.joined_at && (
              <span>{new Date(node.joined_at).toLocaleDateString('de-DE')}</span>
            )}
          </div>
        </div>

        {/* Expand indicator */}
        {hasChildren && (
          <span className="text-kraft-muted text-xs flex-shrink-0">
            {node.expanded ? '\u25BC' : '\u25B6'} {node.children.length}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && node.expanded && (
        <ul className="relative mt-0">
          {node.children.map(child => (
            <TreeNodeComponent key={child.id} node={child} onToggle={onToggle} t={t} />
          ))}
        </ul>
      )}
    </li>
  )
}

const MAX_DEPTH = 5

export default function NetworkTree({ partnerId }: { partnerId: string }) {
  const { t } = useI18n()
  const [tree, setTree] = useState<TreeNode[]>([])
  const [stats, setStats] = useState<NetworkStats>({ total: 0, active: 0, directPartners: 0, newThisWeek: 0 })
  const [loading, setLoading] = useState(true)
  const [maxDepthWarning, setMaxDepthWarning] = useState(false)

  useEffect(() => {
    const fetchDownline = async () => {
      setLoading(true)

      // Fetch full downline via RPC
      const { data } = await supabase.rpc('get_full_downline', {
        root_partner_id: partnerId,
        include_status: 'all',
      })

      // Also fetch direct children for display names
      const { data: directChildren } = await supabase
        .from('partner_network')
        .select('id, user_id, display_name, status, level, joined_at, parent_partner_id')
        .eq('parent_partner_id', partnerId)

      const downlineNodes: DownlineNode[] = (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        user_id: row.user_id as string,
        display_name: (row.display_name as string | null) || null,
        email: (row.email as string | null) || null,
        status: (row.status as string) || 'pending',
        level: (row.level as number) || 0,
        joined_at: (row.joined_at as string | null) || null,
        parent_partner_id: (row.parent_partner_id as string | null) || null,
      }))

      // Merge display names from direct children query
      if (directChildren) {
        for (const dc of directChildren) {
          const existing = downlineNodes.find(n => n.id === dc.id)
          if (existing && dc.display_name) {
            existing.display_name = dc.display_name
          }
          if (!existing) {
            downlineNodes.push({
              id: dc.id,
              user_id: dc.user_id,
              display_name: dc.display_name,
              email: null,
              status: dc.status,
              level: dc.level,
              joined_at: dc.joined_at,
              parent_partner_id: dc.parent_partner_id,
            })
          }
        }
      }

      // Calculate stats
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      const activeCount = downlineNodes.filter(n => n.status === 'active').length
      const directCount = downlineNodes.filter(n => n.parent_partner_id === partnerId).length
      const newThisWeek = downlineNodes.filter(n =>
        n.joined_at && new Date(n.joined_at) >= oneWeekAgo
      ).length

      setStats({
        total: downlineNodes.length,
        active: activeCount,
        directPartners: directCount,
        newThisWeek,
      })

      // Check max depth
      const maxLevel = downlineNodes.reduce((max, n) => Math.max(max, n.level), 0)
      setMaxDepthWarning(maxLevel > MAX_DEPTH)

      // Build tree
      const builtTree = buildTree(downlineNodes, partnerId)
      setTree(builtTree)
      setLoading(false)
    }

    fetchDownline()
  }, [partnerId])

  const toggleNode = useCallback((nodeId: string) => {
    setTree(prev => {
      function toggle(nodes: TreeNode[]): TreeNode[] {
        return nodes.map(node => {
          if (node.id === nodeId) return { ...node, expanded: !node.expanded }
          if (node.children.length > 0) return { ...node, children: toggle(node.children) }
          return node
        })
      }
      return toggle(prev)
    })
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-kraft-border/30 rounded w-1/3 mb-4" />
        <div className="h-20 bg-kraft-border/20 rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-kraft-dark">{stats.total}</p>
          <p className="text-[11px] text-kraft-muted mt-1">{t.network.statTotal}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          <p className="text-[11px] text-kraft-muted mt-1">{t.network.statActive}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-kraft-accent">{stats.directPartners}</p>
          <p className="text-[11px] text-kraft-muted mt-1">{t.network.statDirect}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-kraft-dark">{stats.newThisWeek}</p>
          <p className="text-[11px] text-kraft-muted mt-1">{t.network.statNewThisWeek}</p>
        </div>
      </div>

      {/* Max depth warning */}
      {maxDepthWarning && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3 text-sm text-yellow-800">
          {t.network.maxDepthWarning}
        </div>
      )}

      {/* Tree */}
      <div className="bg-white rounded-2xl p-6 shadow-sm overflow-x-auto">
        {tree.length === 0 ? (
          <p className="text-kraft-muted text-sm text-center py-8">{t.network.emptyTree}</p>
        ) : (
          <ul className="relative">
            {tree.map(node => (
              <TreeNodeComponent key={node.id} node={node} onToggle={toggleNode} t={t} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
