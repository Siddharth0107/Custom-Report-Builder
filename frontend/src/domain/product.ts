
export interface Product {
    id?: string;
    reportId: number;
    parent_report_name: string;
    all_fields:string[];
    dialogVisible:boolean;
    isDisabled:boolean;
}