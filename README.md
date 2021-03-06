# Redux Waiter

[![NPM](https://img.shields.io/npm/v/redux-waiter)](https://npmjs.org/package/redux-waiter)
[![Build Status](https://travis-ci.org/hixme/redux-waiter.svg?branch=master)](https://travis-ci.org/hixme/redux-waiter)

## Installation

`npm i redux-waiter --save`

This gives you access to the reducer, constants, actions, and selectors available.

## Add to your combineReducers()

```javascript
import { reducer } from 'redux-waiter';

const initialState = combineReducers({
  waiter: reducer,
});

const store = createStore(
  initialState,
  {},
  compose(applyMiddleware(...[thunk]))
);
```

**NOTE:** Ensure you have redux-thunk configured as middleware in your store implementation

## Waiter model description and defaults

Each waiter initialized will have these properties.

```javascript
const model = {
  // incremented after each request
  id: 0,

  // your waiter's name
  name: null,

  // your request to track
  requestCreator: null,

  // the params for your request to use
  params: null,

  // the promise returned from the requestCreator
  request: null,

  // the result of the promise
  response: null,

  // the error if returned from the promise
  error: null,

  // true if the request is called a second time and isPending
  isRefreshing: false,

  // true when the request is pending
  isPending: false,

  // true when the request returns an error
  isRejected: false,

  // true when the request returns successfully
  isResolved: false,

  // true if the request resolves or rejects
  isCompleted: false,

  // true if the request is canceled
  isCanceled: false,

  // true if the request rejected, and is being called again
  isRetrying: false,

  // start time of request in milliseconds UTC
  startTime: null,

  // end time of request in milliseconds UTC
  endTime: null,

  // difference in milliseconds of start and end times
  elapsedTime: null,

  // last time the model changed in milliseconds UTC
  lastModified: null,

  // how many times the request has been called and returned an error
  // resets after a successful response
  attempts: 0,
};
```

## connectWaiter

`import { connectWaiter } from 'redux-waiter'`

connectWaiter is a higher-order-component that connects your waiter
promise to another component.
You can listen in on waiter events and dispatch other actions. You can add
custom views to different waiter states,
as well as add custom actions to the mount and unmount lifecycle events

Below is the full interface for connectWaiter, ordered in the sequence that the actions take place

```javascript
import { connectWaiter } from 'redux-waiter';
import MyComponent from 'path/to/MyComponent';
import notification from 'path/to/notification';

const SearchRequestForm = connectWaiter({
  /* 
   * Configuration settings 
   */

  // name can be a string or a function with access to props 
  name: (props) => 'my-waiter-name',

  // requestCreator, your promise builder 
  requestCreator: (params, props) => yourAPI.getSomething(params),

  /* 
   * Alternate views 
   */

  pendingView: LoadingView,
  rejectedView: FailureView,

  /* 
   * Lifecycle configs and state change callbacks
   */

  // onMount
  onMount: (waiter, props) => {
    // Hey, we mounted!
    console.log('onMount', waiter)
  },

  // clear the waiter data when the component is added to the view
  clearOnMount: true,

  // create your promise request when mounting your component
  requestOnMount: true,

  // pass parameters to the request creator based on props
  requestOnMountParams: (props) => ({ name: 'First', last: 'Last' }),

  // like requestOnMountParams, but used to initialize the call to
  // the waiter again on props change
  requestOnPropsChange: (props) => ({ name: 'First', last: 'Last' }),

  // state change callbacks 
  onPending: (waiter, props) => {
    // And we're off! 
    console.log('onPending - ', waiter);
  },
  onResolve: (waiter, props) => {
    // Success!
    console.log('onResolve - ', waiter.response);
  },
  onReject: (waiter, props) => {
    // Oh no...error
    console.log('onReject - ', waiter.error);
  },
  onComplete: (waiter, props) => {
    // All done!
    console.log('onComplete - ', waiter);
  },
  onRefresh: (waiter, props) => {
    // We're updating our response!
    console.log('onRefresh - ', waiter)
  },
  onCancel: (waiter, props) => {
    // The waiter canceled, do what you need to clean up 
    console.log('onCancel - ', waiter)
  },

  // on unmount
  onUnmount: (waiter, props) => {
    // Say goodbye to your view! 
    console.log('onUnmount - ', waiter);
  },

  // clear the waiter data when the component is removed from view
  clearOnUnmount: true,

})(MyComponent);
```

## Actions

### callWaiter(waiterName, { params, requestCreator })

The call action will invoke the requestCreator with the supplied params and
store all waiter processes to the waiterName given.

```javascript
import { callWaiter } from 'redux-waiter';

dispatch(
  callWaiter('get-toy', {
    requestCreator: (params) => getToyPromise(params.id),
    params: { id: '1' },
  })
);
```

### prepareWaiter(waiterName, { params, requestCreator })

Prepare is the same as callWaiter, but it will only store up the params and request
creator to the waiterName. It will not invoke the requestCreator until
callWaiter(waiterName) is dispatched

```
import { prepareWaiter } from 'redux-waiter'

dispatch(
  prepareWaiter('get-toy', {
    requestCreator: (params) => getToyPromise(params.id),
    params: { id: '1'}
  })
)

// then somewhere else you can call it
dispatch(callWaiter('get-toy'))
```

### clearWaiter(waiterName)

Clear will reset the waiter as if it was never called. This removes all
params, response, and error data. The waiter stays in the store and can be
used again.

```javascript
import { clearWaiter } from 'redux-waiter';

// In your redux environment
dispatch(clearWaiter('waiter-name'));
```

### clearAll()

Clear all the waiters in the store.

```javascript
import { clearAll } from 'redux-waiter';

// In you redux environment
dispatch(clearAll());
```

### destroyWaiter(waiterName)

Destroy will remove the waiter from the store. It will not longer be
accessible unless initialized again.

```javascript
import { destroyWaiter } from 'redux-waiter';

// In you redux environment
dispatch(destroyWaiter('waiter-name'));
```

### destroyAll()

Destroy all the waiters in the store.

```javascript
import { destroyAll } from 'redux-waiter';

// In you redux environment
dispatch(destroyAll());
```

## Selectors

### getWaiter(state, waiterName)

Get the waiter model from the store by it's name.

```javascript
import { getWaiter } from 'redux-waiter';

// In your mapStateToProps somewhere
(state) => getWaiter(state, 'get-toy');
```

### getWaiterResponse(state, waiterName)

Get only the response of the promise by the waiter name. Returns null if no
response has been set.

```javascript
import { getWaiterResponse } from 'redux-waiter';

// In your mapStateToProps somewhere
(state) => getWaiterResponse(state, 'get-toy');
```

### getWaiterError(state, waiterName)

Get only the error of the promise by the waiter name. Returns null if no error
has been set.

```javascript
import { getWaiterError } from 'redux-waiter';

// In your mapStateToProps somewhere
(state) => getWaiterError(state, 'get-toy');
```

## Example

### Valid Document Link

Create your component with the `connectWaiter`

```javascript
import React from 'react';
import axios from 'axios';

import { connectWaiter } from 'redux-waiter';

const ValidUrlLink = connectWaiter({
  // dynamic waiter name using props
  name: (props) => `link:${props.url}`,

  requestCreator: (params) => axios({ url: params.url }),
  requestOnMountParams: (props) => ({ url: props.url }),

  // alternate views for the Promise lifecycle
  pendingView: () => <span>...</span>,
  rejectedView: () => <span>Invalid link</span>,
})((props) => <a href={props.url}>Click to View</a>);
```

Implement your component in the JSX

```html
... <ValidUrlLink url="https://link.to.pdf" />' ...
```

## Dependencies

Due to the asynchronous nature of this library, redux-waiter requires that you have redux-thunk configured as middleware for your store.
