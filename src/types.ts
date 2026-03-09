export interface Visit {
  id: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  end_time?: string; // HH:mm
  name: string;
  position?: string;
  affiliation: string;
  purpose: string;
  contact: string;
  status: 'pending' | 'approved' | 'rejected';
  reject_reason?: string;
  created_at: string;
}

export interface VisitFormData {
  date: string;
  time: string;
  end_time: string;
  name: string;
  position: string;
  affiliation: string;
  purpose: string;
  contact: string;
}
