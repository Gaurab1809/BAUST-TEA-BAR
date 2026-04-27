import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", fontFamily: "monospace", color: "red", backgroundColor: "#fdd", minHeight: "100vh" }}>
          <h1>REACT FATAL CRASH DETECTED!</h1>
          <h2>Please copy all the text below and send it to your AI assistant:</h2>
          <hr />
          <h3>Error Message:</h3>
          <strong>{this.state.error && this.state.error.toString()}</strong>
          <br /><br />
          <h3>Component Stack:</h3>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "12px" }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
          <br />
          <h3>Full Stack:</h3>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "10px" }}>
            {this.state.error && this.state.error.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
