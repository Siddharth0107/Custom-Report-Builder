
export interface Product {
    id?: string;
    reportId?: string;
    name?: string;
    description?: string;
    price?: number;
    quantity?: number;
    inventoryStatus?: string;
    category?: string;
    image?: string;
    rating?: number;
    selectedColumns: { column:string,is_selected:boolean }[]; 
    columnsList:string[];
    isSaved:boolean;
    readonly:boolean;
    hasUnsavedChanges:boolean;
    ediBtnEnable:boolean;
    saveBtnEnable:boolean;
    all_fields:string[];
    dialogVisible:boolean;
}