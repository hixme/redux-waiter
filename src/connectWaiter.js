// For componentDidCatch as we just want to warn of an issue
// for a user's wrapped component when an error is thrown
/* eslint-disable class-methods-use-this */
/* eslint-disable no-console */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as selectors from './selectors';
import * as actions from './actions';

function isFunction(fn) {
  return fn && {}.toString.call(fn) === '[object Function]';
}

export default (params) => {
  const PendingView = params.pendingView;
  const RejectedView = params.rejectedView;

  return (View) => {
    class WaiterEvent extends Component {
      static propTypes = {
        name: PropTypes.string.isRequired,
        waiter: PropTypes.object.isRequired,
        callWaiter: PropTypes.func.isRequired,
        clearWaiter: PropTypes.func.isRequired,
        dispatch: PropTypes.func.isRequired,

        isPending: PropTypes.bool,
        isRejected: PropTypes.bool,
      };

      static defaultProps = {
        isPending: false,
        isRejected: false,
      };

      componentDidMount() {
        const { requestOnMount, requestOnMountParams } = params;

        if (params.onMount) {
          params.onMount(this.props.waiter, this.props);
        }

        if (params.clearOnMount) {
          this.props.dispatch(this.props.clearWaiter(this.props.name));
        }

        // make a request on mount if needed
        if (requestOnMount || requestOnMountParams) {
          this.initRequest(this.props);
        }
        this.checkEvents();
      }

      componentDidUpdate(prevProps) {
        this.checkEvents(this.props);

        // recall the request if requestOnPropsChange allows
        if (
          params.requestOnPropsChange &&
          params.requestOnPropsChange(this.props, prevProps)
        ) {
          this.initRequest(this.props);
        }
      }

      componentWillUnmount() {
        if (params.onUnmount) {
          params.onUnmount(this.props.waiter, this.props);
        }

        if (params.clearOnUnmount) {
          this.props.dispatch(this.props.clearWaiter(this.props.name));
        }
      }

      componentDidCatch() {
        console.warn(
          'redux-waiter: We caught an error in your component. It was caught to prevent the waiter from rejecting your request.'
        );
      }

      initRequest(props) {
        const { requestOnMountParams, requestCreator } = params;

        const requestParams = {
          requestCreator,
          params: requestOnMountParams ? requestOnMountParams(props) : null,
        };

        this.props.dispatch(
          this.props.callWaiter(this.props.name, requestParams)
        );
      }

      checkEvents(props) {
        if (!props) return;

        const prevPropRequest = this.props.waiter;
        const { waiter } = props;
        const {
          isPending,
          isResolved,
          isRejected,
          isCompleted,
          isCanceled,
          isRefreshing,
          isRetrying,
        } = waiter;

        if (
          isRejected &&
          isRejected !== prevPropRequest.isRejected &&
          params.onReject
        ) {
          params.onReject(waiter, this.props);
        }

        if (
          isPending &&
          isPending !== prevPropRequest.isPending &&
          params.onPending
        ) {
          params.onPending(waiter, this.props);
        }

        if (
          isResolved &&
          isResolved !== prevPropRequest.isResolved &&
          params.onResolve
        ) {
          params.onResolve(waiter, this.props);
        }

        if (
          isCompleted &&
          isCompleted !== prevPropRequest.isCompleted &&
          params.onComplete
        ) {
          params.onComplete(waiter, this.props);
        }

        if (
          isRefreshing &&
          isRefreshing !== prevPropRequest.isRefreshing &&
          params.onRefresh
        ) {
          params.onRefresh(waiter, this.props);
        }

        if (
          isRetrying &&
          isRetrying !== prevPropRequest.isRetrying &&
          params.onRetry
        ) {
          params.onRetry(waiter, this.props);
        }

        if (
          isCanceled &&
          isCanceled !== prevPropRequest.isCanceled &&
          params.onCancel
        ) {
          params.onCancel(waiter, this.props);
        }
      }

      render() {
        if (this.props.waiter.isPending && PendingView) {
          return <PendingView {...this.props} />;
        }

        if (this.props.waiter.isRejected && RejectedView) {
          return <RejectedView {...this.props} />;
        }

        return <View {...this.props} />;
      }
    }

    const mapStateToProps = (state, ownProps) => {
      const name =
        params.name && isFunction(params.name)
          ? params.name(ownProps)
          : params.name;
      return {
        name,
        waiter: selectors.getWaiter(state, name),
      };
    };

    const mapDispatchToProps = (dispatch) => ({ ...actions, dispatch });

    return connect(mapStateToProps, mapDispatchToProps)(WaiterEvent);
  };
};
