export interface CompanySearchRequest {
  signal: AbortSignal;
  isCurrent: () => boolean;
}

export class CompanySearchRequestGate {
  private version = 0;
  private controller: AbortController | null = null;

  begin(): CompanySearchRequest {
    this.controller?.abort();
    const controller = new AbortController();
    const requestVersion = ++this.version;
    this.controller = controller;
    return {
      signal: controller.signal,
      isCurrent: () => this.version === requestVersion
        && this.controller === controller
        && !controller.signal.aborted,
    };
  }

  invalidate(): void {
    this.version += 1;
    this.controller?.abort();
    this.controller = null;
  }
}
