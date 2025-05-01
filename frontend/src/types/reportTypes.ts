export type APIResponse = {
    data: any;
    status: string;
    message: string;
}

export type ReportColumns = {
    column_name: string;
    label: string;
}

export type ReportFilters = {
    id: number;
    report_id: number;
    filter_name: string;
    filter_label: string;
    exist_in_report: boolean;
}

export type Report = {
    id: number;
    report_name: string;
    report_columns: Array<ReportColumns>;
    report_filters: Array<ReportFilters>;
}

export type TransformedReport = {
    reportId: number;
    parent_report_name: string;
    saveBtnEnable: boolean,
    columns: Array<ReportColumns>;
    outer_filters: Array<ReportFilters>;
    dialogVisible: boolean;
    isDisabled: boolean;
}

export type TransformedTemplate = {
    id: number;
    name: string;
    parent_report: Report;
    template: Array<ReportColumns>;
    template_filter: Array<TemplateFilter>;
}

export type TemplateFilter = {
    filter_name: string;
    filter_label: string;
}

export type Templates = {
    id: number;
    name: string;
    parent_report: Report;
    template: Array<ReportColumns>;
    template_filter: Array<TemplateFilter>;
    dialogVisible: boolean;
}

export type OuterFilterViewData = {
    filter_label: string;
    filter_type: string;
    filter_name: string;
    is_compulsory: boolean;
    values: Array<string>;
}

export type ReportData = {
    template_id: number;
    template_name: string;
    report_name: string;
    columns: string[];
    data: { [key: string]: string }[];
}