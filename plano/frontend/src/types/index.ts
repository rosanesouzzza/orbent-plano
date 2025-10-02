export interface Action {
  id: string;
  title: string;
  description?: string;
  pillar?: string;
  department?: string;
  due_date?: string;
  status: string;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  origin?: string;
  created_at: string;
  actions: Action[];
}
