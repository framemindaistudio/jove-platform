/** Certificate types, wording and the record shape shared by the issue flow and the print sheet. */

export interface CertRecord {
  id: string;
  code: string;
  studentName: string;
  grade?: string;
  schoolName?: string;
  program?: string;
  type?: string;
  issueDate?: string;
  status?: string;
  workshopId?: string;
  batch?: string;
}

export interface CertTypeMeta {
  value: string;
  /** Printed headline, e.g. "Certificate of Participation". */
  title: string;
  /** Small label above the name. */
  presentedTo: string;
  /** Sentence lead-in that precedes the programme name. */
  citation: string;
  /** Show the "Grade · School" line under the name. */
  school: boolean;
}

export const CERT_TYPES: CertTypeMeta[] = [
  { value: "Participation", title: "Certificate of Participation", presentedTo: "This certificate is proudly presented to", citation: "for taking part, with curiosity and teamwork, in", school: true },
  { value: "Merit", title: "Certificate of Merit", presentedTo: "This certificate of merit is awarded to", citation: "in recognition of outstanding effort and performance in", school: true },
  { value: "Winner", title: "Certificate of Achievement", presentedTo: "This certificate of achievement is awarded to", citation: "for winning the challenge round of", school: true },
  { value: "Lab completion", title: "Certificate of Completion", presentedTo: "This certificate is proudly presented to", citation: "for successfully completing the JOVE Virtual Lab", school: false },
  { value: "Teacher training", title: "Certificate of Training", presentedTo: "This certificate is awarded to", citation: "for completing the JOVE teacher training programme", school: true },
  { value: "Trainer", title: "Certificate of Recognition", presentedTo: "This certificate of recognition is awarded to", citation: "in recognition of qualifying and serving as a JOVE Trainer for", school: false },
];

export const certMeta = (type?: string): CertTypeMeta => CERT_TYPES.find((t) => t.value === type) ?? CERT_TYPES[0];

export const DEFAULT_PROGRAM = "JOVE Day: Robotics, AI & ML Workshop";
