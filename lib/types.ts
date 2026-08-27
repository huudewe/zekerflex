export type ShiftStatus = 'open' | 'vervuld' | 'geannuleerd';
export type ApplicationStatus = 'In behandeling' | 'Aangenomen' | 'Afgewezen';

export interface Shift {
  id: string;
  created_at: string;
  title: string;
  company: string;
  location: string;
  rate: number;
  date_display: string;
  starts_at?: string;
  ends_at?: string;
  category: string;
  status: ShiftStatus;
  user_id?: string;
}

export interface Application {
  id: string;
  created_at: string;
  shift_id: string;
  applicant_user_id?: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  motivation?: string;
  status: ApplicationStatus;
  shifts?: Shift;
}
