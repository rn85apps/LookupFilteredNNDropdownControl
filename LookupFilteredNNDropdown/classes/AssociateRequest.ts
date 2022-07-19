import { IEntityReference } from "../interfaces/IEntityReference";

export class AssociateRequest {
  target: IEntityReference;
  relatedEntities: IEntityReference[];
  relationship: string;

  constructor(
    target: IEntityReference,
    relatedEntities: IEntityReference[],
    relationshipName: string
  ) {
    this.target = target;
    this.relatedEntities = relatedEntities;
    this.relationship = relationshipName;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  getMetadata() {
    return {
      boundParameter: null,
      parameterTypes: {},
      operationType: 2,
      operationName: "Associate",
    };
  }
}
