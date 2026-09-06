import { RiskScanDirectoryDiscovery } from "../discovery/riskscan-directory-discovery";
import { RiskScanNativeQuoteCompatibility } from "../riskscan/native-quote/riskscan-native-quote-compatibility";
import { RiskScanToolLoop } from "../riskscan/tool-loop/riskscan-tool-loop";

export function GuestRiskScanWorkbench() {
  return (
    <section className="max-w-3xl space-y-10" aria-label="Guest RiskScan workbench">
      <section className="space-y-4" aria-labelledby="directory-step">
        <div className="space-y-2">
          <h2 id="directory-step" className="text-2xl font-semibold tracking-tight">Inspect the local directory</h2>
          <p className="text-muted-foreground">Read the local descriptor before the next step.</p>
        </div>
        <RiskScanDirectoryDiscovery />
      </section>
      <section className="space-y-4" aria-labelledby="compatibility-step">
        <div className="space-y-2">
          <h2 id="compatibility-step" className="text-2xl font-semibold tracking-tight">Check native compatibility</h2>
          <p className="text-muted-foreground">Use a caller-supplied local policy for this check.</p>
        </div>
        <RiskScanNativeQuoteCompatibility />
      </section>
      <section className="space-y-4" aria-labelledby="tool-loop-step">
        <div className="space-y-2">
          <h2 id="tool-loop-step" className="text-2xl font-semibold tracking-tight">Follow the ToolLoop boundary</h2>
          <p className="text-muted-foreground">Use the existing unsigned ToolLoop boundary when you are ready.</p>
        </div>
        <RiskScanToolLoop />
      </section>
    </section>
  );
}
