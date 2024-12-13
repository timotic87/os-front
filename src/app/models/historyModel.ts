export class HistoryModel {
  private ID: number;
  private description: string;
  private actionTime: Date;
  private projectID: number;
  private userID: number;
  private firstName: string;
  private lastName: string;
  private profilePicUrl: string;

  constructor(ID: number, description: string, actionTime: string, projectID: number, userID: number, firstName: string,
              lastName: string, profilePicUrl: string) {
    this.ID = ID;
    this.description = description;
    const parsedDate = new Date(actionTime);
    parsedDate.setHours(parsedDate.getHours() - 1);
    this.actionTime = parsedDate;

    this.projectID = projectID;
    this.userID = userID;
    this.firstName = firstName;
    this.lastName = lastName;
    this.profilePicUrl = profilePicUrl;
  }

  public getID(): number {
    return this.ID;
  }

  public getDescription(): string {
    return this.description;
  }

  public getActionTime(): Date {
    return this.actionTime;
  }

  public getProjectID(): number {
    return this.projectID;
  }

  public getUserID(): number {
    return this.userID;
  }

  public getFirstName(): string {
    return this.firstName;
  }

  public getLastName(): string {
    return this.lastName;
  }

  public getProfilePicUrl(): string {
    return this.profilePicUrl;
  }
}
