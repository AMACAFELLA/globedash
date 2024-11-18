import { Component, ErrorInfo, ReactNode } from "react";
import logger from "../utils/logger";
// Props interface for ErrorBoundary
interface Props {
  children: ReactNode;
}
// State interface for ErrorBoundary
interface State {
  hasError: boolean;
}
// ErrorBoundary class component
class ErrorBoundary extends Component<Props, State> {
  // Initial state
  public state: State = {
    hasError: false,
  };
  // Update state on error
  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }
  // Log error when caught
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("Uncaught error:", error, errorInfo);
  }
  // Render error message or children
  public render() {
    if (this.state.hasError) {
      return <h1>Sorry.. there was an error</h1>;
    }
    return this.props.children;
  }
}
export default ErrorBoundary;
