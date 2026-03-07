/**
 * Interfaces para el Módulo de Email Marketing.
 */

export interface EmailSegment {
    id: string;
    tienda_id: string;
    usuario_id: string;
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
    tienda_id: string;
    usuario_id: string;
    name: string;
    subject: string;
    template_id: string;
    segment_id: string;
    status: 'draft' | 'scheduled' | 'processing' | 'completed' | 'failed';
    scheduled_at?: string;
    sender_name?: string;
    sender_prefix?: string;
    created_by?: string;
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
    subject: string;
    sender_name?: string;
    sender_prefix?: string;
    preview_url?: string;
    html_content?: string;
    status: 'activo' | 'archivado';
}

export interface MarketingEvent {
    id: string;
    event_type: string;
    user_id?: string;
    email: string;
    template_id?: string;
    template?: { name: string };
    variables: Record<string, any>;
    status: 'pending' | 'sent' | 'failed' | 'test' | 'skipped';
    is_test_email: boolean;
    error_message?: string;
    created_at: string;
    sent_at?: string;
}

export interface MarketingEventMapping {
    id: string;
    event_type: string;
    template_id: string;
    enabled: boolean;
    template_name?: string;
    category?: string;
    updated_at: string;
}
