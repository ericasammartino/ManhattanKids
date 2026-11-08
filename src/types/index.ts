export interface Organization {
  "Organization ID": string;
  "Organization Name": string;
  "Organization Type": string | null;
  "Description": string | null;
  "Website": string | null;
  "Contact Email": string | null;
  "Phone": string | null;
  "Logo URL": string | null;
  "Instagram URL": string | null;
  "Status": string | null;
  "Source URL": string | null;
  "Last Verified": string | null;
  "Notes": string | null;
  "External ID": string | null;
}

export interface Location {
  "Location ID": string;
  "Location Name": string;
  "Organization ID": string;
  "Venue Type": string | null;
  "Description": string | null;
  "Street Address": string | null;
  "Address Line 2": string | null;
  "Neighborhood": string | null;
  "Borough": string | null;
  "Zip Code": number | null;
  "Latitude": number | null;
  "Longitude": number | null;
  "Website": string | null;
  "Phone": string | null;
  "Opening Hours": string | null;
  "Admission Price": string | null;
  "Admission Notes": string | null;
  "Setting": string | null;
  "Minimum Age": number | null;
  "Maximum Age": number | null;
  "Amenities/Accessibility": string | null;
  "Kid Friendly Features": string | null;
  "Image URL": string | null;
  "Public Listing": string | null;
  "Source URL": string | null;
  "Status": string | null;
  "Last Verified": string | null;
  "Notes": string | null;
}

export interface Activity {
  "Activity ID": string;
  "Activity Name": string;
  "Organization ID": string;
  "Default Location ID": string;
  "Default Location Name": string | null;
  "Description": string | null;
  "Primary Category": string | null;
  "Subcategory": string | null;
  "Secondary Categories": string | null;
  "Activity Type": string | null;
  "Setting": string | null;
  "Age Minimum": number | null;
  "Age Maximum": number | null;
  "Grade Minimum": string | null;
  "Grade Maximum": string | null;
  "Drop-Off Allowed": string | null;
  "Adult Required": string | null;
  "Schedule Pattern": string | null;
  "Price Minimum": number | null;
  "Price Maximum": number | null;
  "Registration Requirement": string | null;
  "Registration URL": string | null;
  "Seasonal Tags": string | null;
  "Image URL": string | null;
  "Source URL": string | null;
  "Status": string | null;
  "Last Verified": string | null;
  "Notes": string | null;
}

export interface Session {
  "Session ID": string;
  "Activity ID": string;
  "Location ID": string;
  "Session Name": string | null;
  "Start Date": string | null;
  "End Date": string | null;
  "Start Time": string | null;
  "End Time": string | null;
  "Days of the Week": string | null;
  "Schedule Pattern": string | null;
  "Minimum Age Override": number | null;
  "Maximum Age Override": number | null;
  "Price Amount": number | null;
  "Cost Structure": string | null;
  "Price Notes": string | null;
  "Availability": string | null;
  "Registration Opens": string | null;
  "Registration Closes": string | null;
  "Registration URL": string | null;
  "Status": string | null;
  "Source URL": string | null;
  "Last Verified": string | null;
  "Notes": string | null;
}

export interface IncomingActivity {
  "Import ID": string;
  "Date Discovered": string | null;
  "Organization": string | null;
  "Activity Name": string | null;
  "Activity Type": string | null;
  "Category": string | null;
  "Description": string | null;
  "Minimum Age": number | null;
  "Maximum Age": number | null;
  "Date": string | null;
  "Start Time": string | null;
  "End Time": string | null;
  "Price": number | null;
  "Source URL": string | null;
  "Existing Activity ID": string | null;
  "Review Status": string | null;
  "Notes": string | null;
}

export interface EnrichedActivity extends Activity {
  organization?: Organization;
  location?: Location;
  sessions?: Session[];
}
