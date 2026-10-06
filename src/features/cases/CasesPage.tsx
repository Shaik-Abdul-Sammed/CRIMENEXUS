import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FolderGit2, Calendar, MapPin, Tag, UserCheck, Filter } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useInvestigations, useCreateCaseMutation } from '../../hooks/useIntelligenceApi';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { getStatusBadgeClass, getRiskColorClass } from '../../utils/formatters';

const caseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  crimeType: z.string().min(3, 'Crime type is required'),
  locationName: z.string().min(3, 'Location is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  tags: z.string().optional(),
});

type CaseFormData = z.infer<typeof caseSchema>;

export function CasesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: cases, isLoading } = useInvestigations(searchTerm, statusFilter);
  const createCaseMutation = useCreateCaseMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      priority: 'HIGH',
    },
  });

  const onSubmit = (data: CaseFormData) => {
    createCaseMutation.mutate(
      {
        ...data,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()) : ['New Target'],
      },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <FolderGit2 className="h-6 w-6 text-primary" />
            Investigations & Target Cases Workspace
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active criminal investigations, priority tracking, and assigned intelligence dossiers.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={<Plus className="h-4 w-4" />}>
          New Investigation
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by case number, title, or crime type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">Status:</span>
          {['ALL', 'UNDER_INVESTIGATION', 'OPEN', 'COLD_CASE', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background/50 border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Case List Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">Loading target cases...</div>
      ) : cases?.length === 0 ? (
        <div className="p-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
          No matching investigations found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases?.map((c) => (
            <Card key={c.id} className="flex flex-col justify-between hover:border-primary/50 transition-all group">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-primary font-extrabold">{c.caseNumber}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${getStatusBadgeClass(c.status)}`}>
                    {c.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                  {c.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 flex-1">
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {c.description}
                </p>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{c.locationName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Assigned: {c.assignedUserName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Updated: {new Date(c.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {c.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>

              <div className="p-4 pt-0 border-t border-border/40 mt-4 flex items-center justify-between">
                <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getRiskColorClass(c.priority)}`}>
                  Priority: {c.priority}
                </span>
                <Link to={`/cases/${c.id}`}>
                  <Button size="sm" variant="outline">
                    Workspace &rarr;
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Case Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initialize New Investigation Case"
        description="Create an official target dossier for intelligence tracking and relationship discovery."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Case Title" placeholder="Operation name / target description" {...register('title')} error={errors.title?.message} />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Detailed Case Description
            </label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Background context, scope of crime, suspected syndicate..."
              className="w-full rounded-md border border-input bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Crime Classification" placeholder="e.g. Cyber Crime" {...register('crimeType')} error={errors.crimeType?.message} />
            <Input label="Primary Location" placeholder="e.g. Bengaluru & NCR" {...register('locationName')} error={errors.locationName?.message} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Priority Level
            </label>
            <select
              {...register('priority')}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <Input label="Tags (Comma Separated)" placeholder="Money Laundering, Cyber, UPI" {...register('tags')} />

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createCaseMutation.isPending}>
              Create Investigation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
