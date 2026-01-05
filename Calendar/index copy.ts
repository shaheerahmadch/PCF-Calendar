import { IInputs, IOutputs } from "./generated/ManifestTypes";
import "./css/tailwind.min.css";
import "./css/style.css";

export class Calendar implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private container: HTMLDivElement;
    private events: Array<{ start: string, end: string, title: string, details: string, location: string, color: string }>;
    private sampleData = [
        { start: '2024-10-05', end: '2024-10-05', title: 'Project Deadline', details: 'This is the final deadline for the project submission.', location: 'Online', color: '#FF5733' },
        { start: '2024-10-10', end: '2024-10-12', title: 'Team Retreat', details: '3-day retreat at the mountains for team bonding and fun activities.', location: 'Mountain Resort', color: '#337BFF' },
        { start: '2024-10-15', end: '2024-10-16', title: 'Client Presentation', details: 'Important presentation for the new client project.', location: 'Office Meeting Room', color: '#28A745' },
        { start: '2024-10-25', end: '2024-10-27', title: 'Conference', details: 'Attending industry conference on new technology trends.', location: 'Tech Expo Center', color: '#FFD700' },
        { start: '2024-10-25', end: '2024-10-26', title: 'Workshop', details: 'Workshop on Power Platform tools and techniques.', location: 'Online Webinar', color: '#28A745' }
    ];
    private sampleDate = '2024-10-25';
    private calendarMonth: string;
    constructor() {

    }

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this.container = container;


        if (window.location.href.includes("localhost")) {
            // If on localhost, use sample data
            this.events = this.sampleData;
            this.calendarMonth = this.sampleDate;
        } else if (context.parameters.calendarData.raw) {
            // Use actual input data in other environments
            this.events = context.parameters.calendarData.raw.rows;
            this.calendarMonth = context.parameters.calendarDate.raw ? context.parameters.calendarDate.raw : "";
        } else {
            this.events = this.sampleData;
            this.calendarMonth = this.sampleDate;
            console.warn("No roadmap data found in input parameters.");
        }
        this.renderCalendar();

    }


    private isDateInRange(day: number, month: number, year: number, startDate: string, endDate: string): boolean {
        const currentDate = new Date(year, month - 1, day);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return currentDate >= start && currentDate <= end;
    }

    private renderCalendar(): void {
        this.container.innerHTML = '';
        const today = new Date(this.calendarMonth);
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const startDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

        // Create calendar grid
        const calendar = document.createElement('div');
        calendar.className = 'calendar grid grid-cols-7 gap-1';

        // Add empty cells for the days before the start of the month
        for (let i = 0; i < startDay; i++) {
            calendar.appendChild(document.createElement('div'));
        }

        // Generate the days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day bg-white shadow-md p-4 relative';
            dayElement.innerHTML = `<div class="text-lg font-bold">${day}</div>`;

            // Check for events on this date
            this.events.forEach(event => {
                if (this.isDateInRange(day, today.getMonth() + 1, today.getFullYear(), event.start, event.end)) {
                    const eventElement = document.createElement('div');
                    eventElement.className = 'event';
                    eventElement.style.backgroundColor = event.color;
                    eventElement.textContent = event.title;

                    // Create the event popup
                    const popupElement = document.createElement('div');
                    popupElement.className = 'event-popup';
                    popupElement.innerHTML = `
                        <h4>${event.title}</h4>
                        <p class="custom-nowrap">${event.start} to ${event.end}</p>
                        <p class="custom-nowrap">Details: ${event.details}</p>
                        <p class="custom-nowrap">Location: ${event.location}</p>
                    `;
                    eventElement.appendChild(popupElement);
                    dayElement.appendChild(eventElement);
                }
            });

            calendar.appendChild(dayElement);
        }

        this.container.appendChild(calendar);
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        if (window.location.href.includes("localhost")) {
            // If on localhost, use sample data
            this.events = this.sampleData;
            this.calendarMonth = this.sampleDate;
        } else if (context.parameters.calendarData.raw) {
            // Use actual input data in other environments
            this.events = context.parameters.calendarData.raw.rows;
            this.calendarMonth = context.parameters.calendarDate.raw ? context.parameters.calendarDate.raw : "";
        } else {
            this.events = this.sampleData;
            this.calendarMonth = this.sampleDate;
            console.warn("No roadmap data found in input parameters.");
        }
        this.renderCalendar();
    }

    public getOutputs(): IOutputs {
        return {};
    }

    public destroy(): void {
        // Cleanup if needed
    }
}
