import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '../services/userService'
import { tenantService } from '../services/tenantService'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { NativeSelect } from '../components/ui/native-select'
import PageHeader from '../components/PageHeader'
import FormField from '../components/FormField'
import EmptyState from '../components/EmptyState'
import { ActiveBadge, RoleBadge } from '../components/StatusBadge'
import { initials } from '../lib/labels'
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react'

const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['admin', 'staff']),
  tenantId: z.string().uuid('Select a tenant')
})

const UserManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()

  // Get all tenants for dropdown
  const { data: tenantsData } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantService.getAll()
  })

  const { data, isLoading } = useQuery({
    queryKey: ['users', searchTerm],
    queryFn: () => userService.getAll({ search: searchTerm })
  })

  const createMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setIsDialogOpen(false)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setIsDialogOpen(false)
      setEditingUser(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: userService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
    }
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(userSchema)
  })

  const onSubmit = (formData) => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
    reset()
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    reset(user)
    setIsDialogOpen(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(id)
    }
  }

  const users = data?.data || []
  const tenants = tenantsData?.data || []
  const saving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage people, their roles and which tenant they belong to."
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingUser(null); reset({ role: 'staff' }) }}>
                <Plus className="h-4 w-4" />
                Add user
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Edit user' : 'Add user'}</DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Update this account\'s details and access.' : 'Create an account and assign a role.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField id="firstName" label="First name" error={errors.firstName?.message}>
                    <Input id="firstName" aria-invalid={!!errors.firstName} {...register('firstName')} />
                  </FormField>
                  <FormField id="lastName" label="Last name" error={errors.lastName?.message}>
                    <Input id="lastName" aria-invalid={!!errors.lastName} {...register('lastName')} />
                  </FormField>
                  <FormField id="username" label="Username" error={errors.username?.message}>
                    <Input id="username" aria-invalid={!!errors.username} {...register('username')} />
                  </FormField>
                  <FormField id="email" label="Email" error={errors.email?.message}>
                    <Input id="email" type="email" aria-invalid={!!errors.email} {...register('email')} />
                  </FormField>
                  <FormField id="role" label="Role" error={errors.role?.message}>
                    <NativeSelect id="role" {...register('role')}>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </NativeSelect>
                  </FormField>
                  <FormField id="tenantId" label="Tenant" error={errors.tenantId?.message}>
                    <NativeSelect id="tenantId" {...register('tenantId')}>
                      <option value="">Select a tenant</option>
                      {tenants.map(tenant => (
                        <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                      ))}
                    </NativeSelect>
                  </FormField>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving}>
                    {editingUser ? 'Save changes' : 'Create user'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="tabular text-xs text-muted-foreground">
            {isLoading ? 'Loading...' : `${users.length} ${users.length === 1 ? 'user' : 'users'}`}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}
          </div>
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="No users found" description={searchTerm ? 'Try a different search.' : 'Add your first team member.'} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {initials(user.firstName, user.lastName)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{user.username}</TableCell>
                  <TableCell><RoleBadge role={user.role} /></TableCell>
                  <TableCell className="text-muted-foreground">{user.tenant?.name || '—'}</TableCell>
                  <TableCell><ActiveBadge active={user.isActive} /></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(user)} title="Edit user">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(user.id)}
                        title="Delete user"
                        className="text-muted-foreground hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}

export default UserManagement
