import React from 'react'

export default class ErrorBoundary extends React.Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(err, info) { console.error(err, info) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-600">
          Oops—something went wrong. Please refresh or try a different tab.
        </div>
      )
    }
    return this.props.children
  }
}
