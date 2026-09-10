import * as Core from "../src/index.ts";

type Assert<T extends true> = T;
type IsNever<T> = [T] extends [never] ? true : false;
type IsAny<T> = 0 extends 1 & T ? true : false;
type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2)
  ? (<Value>() => Value extends Right ? 1 : 2) extends
      (<Value>() => Value extends Left ? 1 : 2)
    ? true
    : false
  : false;
type ReturnOf<Function> = Function extends (...args: never[]) => infer Result
  ? Result
  : never;
type FirstArgument<Function> = Function extends (
  first: infer First,
  ...rest: never[]
) => unknown
  ? First
  : never;
type SecondArgument<Function> = Function extends (
  first: unknown,
  second: infer Second,
  ...rest: never[]
) => unknown
  ? Second
  : never;
type ArrayElement<Value> = Value extends readonly (infer Element)[] ? Element : never;
type Field<Value, Name extends PropertyKey> = Value extends Record<Name, infer Result>
  ? Result
  : never;
type LacksField<Value, Name extends PropertyKey> = IsAny<Value> extends true
  ? true
  : Name extends keyof Value
  ? false
  : true;

type Parser = typeof Core extends { parseEntityCheckRequest: infer Function }
  ? Function
  : never;
type Normalizer = typeof Core extends { normaliseEntityName: infer Function }
  ? Function
  : never;
type Assessor = typeof Core extends { assessEntityCheck: infer Function }
  ? Function
  : never;
type IsImplemented = IsNever<Parser> extends false
  ? IsNever<Normalizer> extends false
    ? IsNever<Assessor> extends false
      ? true
      : false
    : false
  : false;
type WhenImplemented<Assertion extends boolean> = IsImplemented extends true
  ? Assertion
  : true;

type EntityCheckRequest = ReturnOf<Parser>;
type EntityCheckAssessmentInput = SecondArgument<Assessor>;
type EntityCheckResult = ReturnOf<Assessor>;
type EntityRegistryCandidate = ArrayElement<
  Field<EntityCheckAssessmentInput, "registryCandidates">
>;
type EntityRegistrySource = Field<EntityCheckAssessmentInput, "registrySource">;
type EntitySanctionsDataset = Field<EntityCheckAssessmentInput, "sanctionsDataset">;
type EntitySanctionsEntry = ArrayElement<Field<EntitySanctionsDataset, "entries">>;
type EntitySanctionsSource = Field<EntityCheckResult, "sanctionsSource">;
type EntityCheckDisposition = Field<EntityCheckResult, "disposition">;
type EntityCheckScreen = Field<EntityCheckResult, "sanctionsScreen">;
type AmbiguousResult = Extract<EntityCheckResult, { disposition: "ambiguous" }>;
type NotFoundResult = Extract<EntityCheckResult, { disposition: "not_found" }>;
type ClearFoundResult = Extract<
  EntityCheckResult,
  { disposition: "found"; sanctionsScreen: "clear" }
>;

type _ParserInputIsClosedRequest = Assert<
  WhenImplemented<
    Equal<
      FirstArgument<Parser>,
      {
        requestRef: string;
        jurisdiction: "FR";
        query: string;
        registrationNumber?: string;
      }
    >
  >
>;
type _ParserResultIsRequest = Assert<
  WhenImplemented<Equal<EntityCheckRequest, FirstArgument<Parser>>>
>;
type _NormalizerResultIsString = Assert<
  WhenImplemented<Equal<ReturnOf<Normalizer>, string>>
>;
type _AssessmentInputHasCandidate = Assert<
  WhenImplemented<Equal<Field<EntityRegistryCandidate, "siren">, string>>
>;
type _AssessmentInputHasRegistrySource = Assert<
  WhenImplemented<Equal<Field<EntityRegistrySource, "source">, "FR_RECHERCHE_ENTREPRISES">>
>;
type _AssessmentInputHasSanctionsDataset = Assert<
  WhenImplemented<Equal<Field<EntitySanctionsDataset, "source">, "OFAC_SDN">>
>;
type _AssessmentInputHasSanctionsEntries = Assert<
  WhenImplemented<Equal<Field<EntitySanctionsEntry, "programs">, readonly string[]>>
>;
type _DispositionIsClosed = Assert<
  WhenImplemented<Equal<EntityCheckDisposition, "found" | "ambiguous" | "not_found">>
>;
type _ScreenIsClosed = Assert<
  WhenImplemented<Equal<EntityCheckScreen, "clear" | "hit" | "not_screened">>
>;
type _AmbiguousExists = Assert<
  WhenImplemented<IsNever<AmbiguousResult> extends false ? true : false>
>;
type _AmbiguousHasNoCandidate = Assert<
  WhenImplemented<LacksField<AmbiguousResult, "candidate">>
>;
type _NotFoundExists = Assert<
  WhenImplemented<IsNever<NotFoundResult> extends false ? true : false>
>;
type _NotFoundHasNoCandidate = Assert<
  WhenImplemented<LacksField<NotFoundResult, "candidate">>
>;
type _ClearFoundExists = Assert<
  WhenImplemented<IsNever<ClearFoundResult> extends false ? true : false>
>;
type _ClearFoundHasNoMatches = Assert<
  WhenImplemented<LacksField<ClearFoundResult, "sanctionsMatches">>
>;
type _SanctionsSourceHasNoEntries = Assert<
  WhenImplemented<LacksField<EntitySanctionsSource, "entries">>
>;
