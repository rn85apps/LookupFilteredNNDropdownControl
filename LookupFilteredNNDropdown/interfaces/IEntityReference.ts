export interface IEntityReference {
    /** logical name of the Dataverse table */
    entityType: string;
    /** value of the record's unique identifier; GUID in string format */
    id: string;
    /** the primary name of the record */
    name?: string;
}