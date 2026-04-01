import React from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * CategoryErrorBoundary
 * ──────────────────────
 * Class component wrapping each CategorySection.
 * If a JS runtime error occurs inside (not just API error),
 * this catches it and shows a minimal fallback instead of
 * crashing the entire page.
 *
 * Usage:
 *   <CategoryErrorBoundary slug={slug} title={title}>
 *     <CategorySection slug={slug} title={title} />
 *   </CategoryErrorBoundary>
 */
class CategoryErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log for your monitoring — swap with Sentry/LogRocket if you use them
    console.group(`🔴 [CategoryErrorBoundary] Runtime error in "${this.props.title}"`);
    console.error('Error:', error);
    console.error('Component stack:', info.componentStack);
    console.groupEnd();
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full bg-white py-10 text-center border-t border-zinc-100">
          <p className="text-zinc-400 text-sm mb-1">
            Something went wrong loading <span className="font-bold text-zinc-600">{this.props.title}</span>
          </p>
          <p className="text-zinc-300 text-xs mb-4">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-5 py-2 bg-zinc-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-yellow-600 transition-colors"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CategoryErrorBoundary;