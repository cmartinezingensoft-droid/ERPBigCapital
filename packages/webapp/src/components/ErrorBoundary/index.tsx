// @ts-nocheck
import PropTypes from 'prop-types';
import React from 'react';

function ErrorBoundary({ error, errorInfo, children }) {
  if (errorInfo) {
    return (
      <div>
        <h2>Algo ha ido mal.</h2>

        <details style={{ whiteSpace: 'pre-wrap' }}>
          {error && error.toString()}
          <br />
          {errorInfo.componentStack}
        </details>
      </div>
    );
  }
  return children;
}

ErrorBoundary.defaultProps = {
  children: null,
};

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

export default ErrorBoundary;
