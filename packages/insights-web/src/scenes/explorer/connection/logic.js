import { kea } from 'kea'
import PropTypes from 'prop-types'
import { message, Modal } from 'antd'

import explorerLogic from '../logic'
import sharedLogic from './shared-logic'
import client from 'lib/client'

const connectionsService = client.service('connections')
const connectionTestService = client.service('connection-test')

export default kea({
  path: () => ['scenes', 'connections', 'index'],

  connect: {
    values: [
      explorerLogic, ['connection']
    ],
    actions: [
      sharedLogic, ['openAddConnection'],
      explorerLogic, ['setConnections as setExplorerConnections', 'setConnection as setExplorerConnection']
    ]
  },

  actions: () => ({
    loadConnections: true,
    connectionsLoaded: connections => ({ connections }),

    addConnection: ({ name, url, structurePath, timeout }) => ({ name, url, structurePath, timeout }),
    connectionAdded: (connection) => ({ connection }),

    editConnection: (id, name, url, structurePath, timeout) => ({ id, name, url, structurePath, timeout }),
    connectionEdited: (connection) => ({ connection }),

    testConnection: (url, structurePath) => ({ url, structurePath }),
    testSuccess: true,
    testFailure: true,

    confirmRemoveConnection: (id) => ({ id }),
    removeConnection: (id) => ({ id }),
    connectionRemoved: (id) => ({ id }),

    closeConnection: true,
    openEditConnection: id => ({ id }),

    openSubset: true,
    closeSubset: true
  }),

  reducers: ({ actions }) => ({
    isLoading: [false, PropTypes.bool, {
      [actions.loadConnections]: () => true,
      [actions.connectionsLoaded]: () => false
    }],

    connections: [{}, PropTypes.object, {
      [actions.connectionsLoaded]: (_, payload) => {
        let newState = {}
        payload.connections.forEach(connection => {
          newState[connection._id] = connection
        })
        return newState
      },
      [actions.connectionAdded]: (state, payload) => {
        return Object.assign({}, state, { [payload.connection._id]: payload.connection })
      },
      [actions.connectionEdited]: (state, payload) => {
        return Object.assign({}, state, { [payload.connection._id]: payload.connection })
      },
      [actions.connectionRemoved]: (state, payload) => {
        const { [payload.id]: discard, ...rest } = state // eslint-disable-line
        return rest
      }
    }],

    addIntroMessage: [false, PropTypes.bool, {
      [actions.openAddConnection]: (_, payload) => payload.introMessage
    }],

    isAddOpen: [false, PropTypes.bool, {
      [actions.openAddConnection]: () => true,
      [actions.closeConnection]: () => false,
      [actions.connectionAdded]: () => false,
      [actions.openEditConnection]: () => false
    }],

    isEditOpen: [false, PropTypes.bool, {
      [actions.openAddConnection]: () => false,
      [actions.openEditConnection]: () => true,
      [actions.closeConnection]: () => false,
      [actions.connectionEdited]: () => false,
      [actions.connectionRemoved]: () => false
    }],

    isSaving: [false, PropTypes.bool, {
      [actions.openAddConnection]: () => false,
      [actions.openEditConnection]: () => false,
      [actions.addConnection]: () => true,
      [actions.editConnection]: () => true,
      [actions.removeConnection]: () => true,
      [actions.connectionAdded]: () => false,
      [actions.connectionEdited]: () => false,
      [actions.connectionRemoved]: () => false
    }],

    didTest: [false, PropTypes.bool, {
      [actions.openAddConnection]: () => false,
      [actions.openEditConnection]: () => false,
      [actions.testConnection]: (_, { url }) => !!url
    }],

    isTesting: [false, PropTypes.bool, {
      [actions.openAddConnection]: () => false,
      [actions.openEditConnection]: () => false,
      [actions.testConnection]: () => true,
      [actions.testSuccess]: () => false,
      [actions.testFailure]: () => false
    }],

    testPassed: [false, PropTypes.bool, {
      [actions.testConnection]: () => false,
      [actions.testSuccess]: () => true,
      [actions.testFailure]: () => false
    }],

    editingConnectionId: [null, PropTypes.string, {
      [actions.openEditConnection]: (_, payload) => payload.id
    }],

    isSubsetOpen: [false, PropTypes.bool, {
      [actions.openSubset]: () => true,
      [actions.closeSubset]: () => false
    }]
  }),

  selectors: ({ constants, selectors }) => ({
    sortedConnections: [
      () => [selectors.connections],
      (connections) => Object.values(connections).sort((a, b) => (a.name || '').localeCompare(b.name || '')),
      PropTypes.array
    ],

    selectedConnection: [
      () => [selectors.sortedConnections, selectors.connection],
      (sortedConnections, connection) => sortedConnections.filter(c => c._id === connection)[0],
      PropTypes.object
    ],

    otherConnections: [
      () => [selectors.sortedConnections, selectors.connection],
      (sortedConnections, connection) => sortedConnections.filter(c => c._id !== connection),
      PropTypes.array
    ],

    editingConnection: [
      () => [selectors.editingConnectionId, selectors.connections],
      (editingConnectionId, connections) => editingConnectionId ? connections[editingConnectionId] : null,
      PropTypes.object
    ]
  }),

  events: ({ actions }) => ({
    afterMount: () => {
      actions.loadConnections()
    }
  }),

  sharedListeners: ({ actions, values }) => ({
    updateExplorerConnections: () => {
      const { connections } = values
      actions.setExplorerConnections(Object.values(connections))
    }
  }),

  listeners: ({ actions, sharedListeners }) => ({
    [actions.connectionsLoaded]: sharedListeners.updateExplorerConnections,
    [actions.connectionAdded]: sharedListeners.updateExplorerConnections,
    [actions.connectionEdited]: sharedListeners.updateExplorerConnections,
    [actions.connectionRemoved]: sharedListeners.updateExplorerConnections,

    [actions.loadConnections]: async function () {
      const connections = await connectionsService.find({})
      actions.connectionsLoaded(connections.data)
    },

    [actions.addConnection]: async function ({ name, url, structurePath, timeout }) {
      const connection = await connectionsService.create({ name, url, structurePath, timeout })
      actions.connectionAdded(connection)
      actions.setExplorerConnection(connection._id)
      message.success(`Connection "${name}" added!`)
    },

    [actions.editConnection]: async function ({ id, name, url, structurePath, timeout }) {
      const connection = await connectionsService.patch(id, { name, url, structurePath, timeout })
      actions.connectionEdited(connection)
      message.success('Changes saved!')
    },

    [actions.confirmRemoveConnection]: async function ({ id }) {
      Modal.confirm({
        title: 'Are you sure delete this connection?',
        content: 'This can not be undone!',
        okText: 'Yes',
        okType: 'danger',
        cancelText: 'No',
        onOk () {
          actions.removeConnection(id)
        }
      })
    },

    [actions.removeConnection]: async function ({ id }) {
      await connectionsService.remove(id)
      actions.connectionRemoved(id)
      actions.setExplorerConnection('')
    },

    [actions.testConnection]: async function ({ url, structurePath }) {
      if (url) {
        try {
          const result = await connectionTestService.find({query: {url, structurePath}})

          if (result.working) {
            actions.testSuccess()
          } else {
            actions.testFailure()
          }
        } catch (e) {
          actions.testFailure()
        }
      } else {
        actions.testFailure()
      }
    }
  })
})
