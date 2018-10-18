import React, { Component } from 'react'
import { connect } from 'kea'

import Tooltip from 'rc-tooltip'
import range from 'lib/utils/range'

import explorerLogic from '~/scenes/explorer/logic'

@connect({
  actions: [
    explorerLogic, [
      'clearColumnWidths',
      'setFacetsCount',
      'requestExport',
      'setExportTitle'
    ]
  ],
  props: [
    explorerLogic, [
      'columnWidths',
      'facetsCount',
      'exportTitle'
    ]
  ]
})
export default class TableSettings extends Component {
  constructor (props) {
    super(props)

    this.state = {
      tooltipHover: false
    }
  }

  handleTooltip = (tooltipHover) => {
    this.setState({ tooltipHover })
  }

  render () {
    const { columnWidths, facetsCount, exportTitle } = this.props
    const { clearColumnWidths, setFacetsCount, requestExport, setExportTitle } = this.props.actions
    const { tooltipHover } = this.state

    const overlay = (
      <div className='column-settings'>
        {Object.keys(columnWidths).length > 0 ? (
          <span onClick={clearColumnWidths} style={{textDecoration: 'underline', cursor: 'pointer'}}>
            Auto-resize columns
          </span>
        ) : (
          <span>
            Auto-resize columns: <u>enabled</u>
          </span>
        )}

        <div className='filter-with-inputs'>
          <span>Facets count:</span>
          {' '}
          <select value={facetsCount} onChange={(e) => setFacetsCount(parseInt(e.target.value) || 0)} style={{display: 'inline-block', margin: 0}}>
            {range(1, 20).map(i => (
              <option value={i} key={i}>{i}</option>
            ))}
          </select>
        </div>
        <br />
        <div>
          Export:
          <br />
          <input value={exportTitle} onChange={e => setExportTitle(e.target.value)} style={{ width: '100%' }} placeholder='Export title...' />
          <br />
          Format:
          {' '}
          <span style={{textDecoration: 'underline', cursor: 'pointer'}} onClick={() => requestExport('xlsx')}>xlsx</span>
          {' - '}
          <span style={{textDecoration: 'underline', cursor: 'pointer'}} onClick={() => requestExport('pdf')}>pdf</span>
        </div>
      </div>
    )

    let className = 'cell-header'

    if (tooltipHover) {
      className = `${className} hover`
    }

    return (
      <Tooltip placement='bottomLeft' trigger={['hover']} overlay={overlay} onVisibleChange={this.handleTooltip}>
        <div className={className}
          onClick={this.handleSort}>
          ☰
        </div>
      </Tooltip>
    )
  }
}
