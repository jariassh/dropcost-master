/**
 * Interfaces para el Módulo de Email Marketing.
 */

export interface EmailSegment {
    id: string;
    name: string;
    description: string;
    filters: SegmentFilters;
    count?: number;
    created_at: string;
}

export interface SegmentFilters {
    conditions: FilterCondition[];
    operator: 'AND' | 'OR';
}

export interface FilterCondition {
    field: string;
    operator: string;
    value: any;
}

export interface EmailCampaign {
    id: string;
    name: string;
    subject: string;
    template_id: string;
    segment_id: string;
    status: 'draft' | 'scheduled' | 'processing' | 'completed' | 'failed';
    scheduled_at?: string;
    created_at: string;
    stats?: CampaignStats;
}

export interface CampaignStats {
    total: number;
    sent: number;
    failed: number;
    pending: number;
}

export interface EmailTemplate {
    id: string;
    name: string;
    preview_url?: string;
}
