import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { ActiveBadge, PlanBadge } from '../components/StatusBadge'
import { SUBSCRIPTION_PLANS } from '../lib/labels'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'

const tenantSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  companyName: z.string().min(3, 'Company name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  subscriptionPlan: z.enum(['basic', 'premium', 'enterprise']).default('basic')
})

const TenantManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantService.getAll()
  })

  const createMutation = useMutation({
    mutationFn: tenantService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['tenants'])
      setIsDialogOpen(false)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => tenantService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tenants'])
      setIsDialogOpen(false)
      setEditingTenant(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: tenantService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['tenants'])
    }
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(tenantSchema)
  })

  const onSubmit = (formData) => {
    if (editingTenant) {
      updateMutation.mutate({ id: editingTenant.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
    reset()
  }

  const handleEdit = (tenant) => {
    setEditingTenant(tenant)
    reset({ ...tenant, phone: tenant.phone || '', address: tenant.address || '' })
    setIsDialogOpen(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this tenant?')) {
      deleteMutation.mutate(id)
    }
  }

  const tenants = data?.data || []
  const saving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Organizations using the system. Each tenant's users and tasks are kept separate."
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingTenant(null); reset({ subscriptionPlan: 'basic' }) }}>
                <Plus className="h-4 w-4" />
                Add tenant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{editingTenant ? 'Edit tenant' : 'Add tenant'}</DialogTitle>
                <DialogDescription>
                  {editingTenant ? 'Update this organization\'s details.' : 'Register a new organization.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField id="name" label="Tenant name" error={errors.name?.message}>
                    <Input id="name" aria-invalid={!!errors.name} {...register('name')} />
                  </FormField>
                  <FormField id="companyName" label="Company name" error={errors.companyName?.message}>
                    <Input id="companyName" aria-invalid={!!errors.companyName} {...register('companyName')} />
                  </FormField>
                  <FormField id="email" label="Email" error={errors.email?.message}>
                    <Input id="email" type="email" aria-invalid={!!errors.email} {...register('email')} />
                  </FormField>
                  <FormField id="phone" label="Phone" hint="(optional)">
                    <Input id="phone" {...register('phone')} />
                  </FormField>
                </div>
                <FormField id="address" label="Address" hint="(optional)">
                  <Input id="address" {...register('address')} />
                </FormField>
                <FormField id="subscriptionPlan" label="Subscription plan">
                  <NativeSelect id="subscriptionPlan" {...register('subscriptionPlan')}>
                    {SUBSCRIPTION_PLANS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </NativeSelect>
                </FormField>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving}>
                    {editingTenant ? 'Save changes' : 'Create tenant'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-medium">All tenants</p>
          <p className="tabular text-xs text-muted-foreground">
            {isLoading ? 'Loading...' : `${tenants.length} ${tenants.length === 1 ? 'tenant' : 'tenants'}`}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}
          </div>
        ) : tenants.length === 0 ? (
          <EmptyState icon={Building2} title="No tenants yet" description="Add an organization to start onboarding users." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">Tenant</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium">{tenant.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{tenant.companyName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{tenant.email}</p>
                    {tenant.phone && <p className="text-xs text-muted-foreground">{tenant.phone}</p>}
                  </TableCell>
                  <TableCell><PlanBadge plan={tenant.subscriptionPlan} /></TableCell>
                  <TableCell><ActiveBadge active={tenant.isActive} /></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(tenant)} title="Edit tenant">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(tenant.id)}
                        title="Delete tenant"
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

export default TenantManagement
