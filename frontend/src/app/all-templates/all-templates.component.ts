import { Component, OnInit } from '@angular/core';
import { ReportService } from './../service/report.service'
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { ColumnDialog } from './../report-builder/report-builder.component'

@Component({
  selector: 'app-all-templates',
  imports: [ButtonModule, ColumnDialog, CommonModule],
  templateUrl: './all-templates.component.html',
  styleUrl: './all-templates.component.css'
})
export class AllTemplatesComponent implements OnInit {

  templates: any = [];

  constructor(private reportService: ReportService, private router: Router) { }

  async handleTemplateListing() {
    try {
      this.reportService.getAllTemplates().subscribe({
        next: (response: any) => {
          this.templates = response;
        },
        error: (error: any) => {
          console.log(error);
        }
      })
    } catch (error) {
      console.log(error);
    }
  }


  async ngOnInit() {
    this.handleTemplateListing()
  }

  deleteTemplate(id: any) {
    this.reportService.deleteTemplate(id).subscribe({
      next: (response: any) => {
        console.log(response);
        this.handleTemplateListing()
      },
      error: (error: any) => {
        console.log(error)
      }
    })
  }

  openDialog(template: any) {
    template.dialogVisible = true;
  }

  closeDialog(template: any) {
    template.dialogVisible = false;
    this.handleTemplateListing();
  }

  createReportFromTemplate(id: number) {
    console.log(id);
    this.router.navigate(['./generated-report'], {
      state: {
        reportData: {
          report_name: "Generated Report",
          report_id: 1,
          parent_report_name: "Parent report",
          data: [
            { task_name: "Prepare monthly sales report", assigned_to: "Emily Clark", assigned_by: "John Stevens" },
            { task_name: "Update client CRM data", assigned_to: "Mike Reynolds", assigned_by: "Sarah Whitman" },
            { task_name: "Design landing page mockup", assigned_to: "Liam Hughes", assigned_by: "Olivia Bennett" },
            { task_name: "Conduct user feedback survey", assigned_to: "Grace Miller", assigned_by: "James Porter" },
            { task_name: "Optimize SEO keywords", assigned_to: "Jake Foster", assigned_by: "Anna Russell" },
            { task_name: "Schedule Q2 strategy meeting", assigned_to: "Laura Kim", assigned_by: "Brian Jacobs" },
            { task_name: "Finalize product roadmap", assigned_to: "Sophia Turner", assigned_by: "David Chen" },
            { task_name: "Test new API integration", assigned_to: "Noah Brooks", assigned_by: "Katherine Adams" },
            { task_name: "Write social media content", assigned_to: "Isabella Green", assigned_by: "Eric Johnson" },
            { task_name: "Create training materials", assigned_to: "Lucas Evans", assigned_by: "Rebecca Hall" },
            { task_name: "Prepare budget forecast", assigned_to: "Chloe Young", assigned_by: "Patrick Lee" },
            { task_name: "Refactor dashboard UI", assigned_to: "Ethan Moore", assigned_by: "Karen Scott" },
            { task_name: "Conduct onboarding session", assigned_to: "Mia Perez", assigned_by: "Aaron Nelson" },
            { task_name: "Draft press release", assigned_to: "Benjamin Cooper", assigned_by: "Lauren Cox" },
            { task_name: "Audit database performance", assigned_to: "Ella Ward", assigned_by: "Sean Mitchell" },
            { task_name: "Develop marketing strategy", assigned_to: "Daniel Murphy", assigned_by: "Nina Brooks" },
            { task_name: "Analyze competitor data", assigned_to: "Ava Sanders", assigned_by: "Gregory Park" },
            { task_name: "Organize team-building event", assigned_to: "Ryan Bell", assigned_by: "Madison Torres" },
            { task_name: "Set up customer support flow", assigned_to: "Zoe Rivera", assigned_by: "Henry Reed" },
            { task_name: "Prepare legal compliance doc", assigned_to: "Gabriel Foster", assigned_by: "Deborah Hayes" },
            { task_name: "Install security patches", assigned_to: "Layla Simmons", assigned_by: "Victor Grant" },
            { task_name: "Deploy staging environment", assigned_to: "Owen Ross", assigned_by: "Rachel Morgan" },
            { task_name: "Edit promotional video", assigned_to: "Amelia Howard", assigned_by: "Jason Ellis" },
            { task_name: "Coordinate product launch", assigned_to: "Nathan James", assigned_by: "Julie Patterson" },
            { task_name: "Conduct market research", assigned_to: "Lily Barnes", assigned_by: "Alan Morris" },
            { task_name: "Clean up legacy code", assigned_to: "Samuel Price", assigned_by: "Melissa Lane" },
            { task_name: "Design event brochure", assigned_to: "Hannah Jenkins", assigned_by: "Timothy Walsh" },
            { task_name: "Compile investor deck", assigned_to: "Anthony White", assigned_by: "Carolyn Bryant" },
            { task_name: "Test mobile responsiveness", assigned_to: "Natalie Cox", assigned_by: "Bruce Knight" },
            { task_name: "Track bug reports", assigned_to: "Elijah Morris", assigned_by: "Vanessa Cruz" },
            { task_name: "Translate website content", assigned_to: "Aria Long", assigned_by: "Todd Fleming" },
            { task_name: "Monitor system uptime", assigned_to: "Jack Hayes", assigned_by: "Diana Payne" },
            { task_name: "Run accessibility audit", assigned_to: "Victoria Gray", assigned_by: "Craig Simmons" },
            { task_name: "Send client invoice", assigned_to: "Caleb Ross", assigned_by: "Jillian Dean" },
            { task_name: "Update brand guidelines", assigned_to: "Zoey Walsh", assigned_by: "Keith Harrington" },
            { task_name: "Plan social media calendar", assigned_to: "Isaac Grant", assigned_by: "Sandra Miles" },
            { task_name: "Create data backup script", assigned_to: "Scarlett Payne", assigned_by: "Gerald Nichols" },
            { task_name: "Build test automation suite", assigned_to: "Levi Bryant", assigned_by: "Sharon Barrett" },
            { task_name: "Host webinar session", assigned_to: "Penelope Douglas", assigned_by: "Walter Robbins" },
            { task_name: "Review UX wireframes", assigned_to: "Julian Steele", assigned_by: "Teresa Franklin" },
            { task_name: "Optimize ad campaign", assigned_to: "Claire Richards", assigned_by: "Douglas Osborne" },
            { task_name: "Draft internal newsletter", assigned_to: "Lincoln Warren", assigned_by: "Tina Cross" },
            { task_name: "Check website analytics", assigned_to: "Paisley Boyd", assigned_by: "Phillip Beck" },
            { task_name: "Train new intern", assigned_to: "Xavier Holt", assigned_by: "Dorothy Powers" },
            { task_name: "Conduct code review", assigned_to: "Brooklyn Keller", assigned_by: "Franklin Daniels" },
            { task_name: "Research grant options", assigned_to: "Hudson Ramsey", assigned_by: "Yvonne Chambers" },
            { task_name: "Test chatbot functionality", assigned_to: "Samantha Paul", assigned_by: "Warren Holt" },
            { task_name: "Analyze survey results", assigned_to: "Asher Newton", assigned_by: "Lori Burke" },
            { task_name: "Configure firewall rules", assigned_to: "Ellie Fleming", assigned_by: "Harold Dawson" },
          ]
        }
      }
    });
  }
}
