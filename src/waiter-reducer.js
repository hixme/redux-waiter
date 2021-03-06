import t from './actionTypes';

export const waiterModel = {
  id: 0, // incremented after each request
  name: null,

  requestCreator: null,
  params: null,

  request: null,
  response: null,
  error: null,

  isRefreshing: false,
  isPending: false,
  isRejected: false,
  isResolved: false,
  isCompleted: false,
  isCanceled: false,
  isRetrying: false,

  startTime: null,
  endTime: null,
  elapsedTime: null,

  lastModified: null,
  attempts: 0,
};

function getTime() {
  return new Date().getTime();
}

const reducerMap = {
  [t.PREPARE]: (state, { name, requestCreator, params }) => ({
    ...state,
    name,
    requestCreator: requestCreator || state.requestCreator,
    params: params || state.params,
  }),
  [t.INIT]: (state, payload) => {
    const { request, name } = payload;

    // If we alredy have a response
    // we are in refresh mode
    const isRefreshing = !!state.response;

    const id = state.id + 1;

    return {
      ...state,

      id,
      name,

      request,
      error: null,

      isRefreshing,
      isPending: true,
      isResolved: false,
      isRejected: false,
      isCompleted: false,
      isCanceled: false,
      isRetrying: false,

      startTime: getTime(),
      lastModified: getTime(),
    };
  },
  [t.RESOLVE]: (state, payload) => ({
    ...state,
    response: payload.response,
    isRefreshing: false,
    isPending: false,
    isResolved: true,
    isRejected: false,
    isCompleted: true,
    isCanceled: false,
    error: null,
    endTime: getTime(),
    elapsedTime: getTime() - state.startTime,
    lastModified: getTime(),
  }),
  [t.REJECT]: (state, payload) => ({
    ...state,
    response: null,
    isRefreshing: false,
    isPending: false,
    isResolved: false,
    isRejected: true,
    isCompleted: true,
    isCanceled: false,
    error: payload.error,
    endTime: getTime(),
    elapsedTime: getTime() - state.startTime,
    lastModified: getTime(),
  }),
  [t.CANCEL]: (state) => ({
    ...state,
    request: null,
    response: null,
    isRefreshing: false,
    isPending: false,
    isResolved: false,
    isRejected: false,
    isCompleted: false,
    isCanceled: true,
    endTime: getTime(),
    elapsedTime: getTime() - state.startTime,
    lastModified: getTime(),
  }),

  [t.CLEAR]: (state) => ({
    ...state,

    request: null,
    response: null,
    error: null,

    isRefreshing: false,
    isPending: false,
    isRejected: false,
    isResolved: false,
    isCompleted: false,
    isCanceled: false,
    isRetrying: false,

    startTime: null,
    endTime: null,
    elapsedTime: null,

    lastModified: getTime(),
    attempts: 0,
  }),
};

export default (state = waiterModel, action) => {
  const reducer = reducerMap[action.type];

  return reducer ? reducer(state, action.payload) : state;
};
