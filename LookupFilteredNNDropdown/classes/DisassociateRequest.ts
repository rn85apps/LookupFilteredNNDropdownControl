import { IEntityReference } from "../interfaces/IEntityReference";

export class DisassociateRequest {
    target: IEntityReference;
    relatedEntityId: string;
    relationship: string;

  constructor(
    target: IEntityReference,
    relatedEntityId: string,
    relationshipName: string
  ) {
    this.target = target;
    this.relatedEntityId = relatedEntityId;
    this.relationship = relationshipName;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  getMetadata() {
    return {
      boundParameter: null,
      parameterTypes: {},
      operationType: 2,
      operationName: "Disassociate",
    };
  }
}
