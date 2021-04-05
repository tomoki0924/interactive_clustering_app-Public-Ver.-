import React, { Component } from 'react'
import  Projection  from './Projection'

const u = new Projection()

class Sidebar extends Component {
  /*
  style = {
    position: "absolute",
    top: "50%",
    left: "25%",
    width: "50px",
    height: "50px",
    fontSize: "30px",
    cursor: "pointer",
  }
  */

  componentDidMount() {
    this.props.setSidebarCanvas1(this.side_canvas1)
    this.props.setSidebarCanvas2(this.side_canvas2)
    this.handleSelectAlgorithm = this.handleSelectAlgorithm.bind(this)
  }

  handleSelectAlgorithm(e) {
    let v = e.target.value
    this.props.selectAlgorithm(v)
  }

  // clearIndex() {
  //   console.log(110)
  // }
  render() {
    let {
      sidebar_orientation,
      sidebar_image_size,
      grem,
      p,
      hover_index1,
      hover_index2,
      mnist_labels,
      color_array,
      algorithm_options,
      algorithm_choice,
    } = this.props

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexGrow: 1,
        }}
      >
        <div>
        <h3>Interactive Clustaring app</h3>
        {/*
          {' '}
          <div
            style={{
              padding: grem / 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>Dimention:</div>
            <select
              onChange={this.handleSelectAlgorithm}
              value={algorithm_options[algorithm_choice]}
            >
              {algorithm_options.map((option, index) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        */}
          <div
            style={{
              display: 'flex',
              flexDirection:
                //sidebar_orientation === 'horizontal' ? 'row' : 'column',
                'row',
            }}
          >
            <div>
              <canvas
                ref={side_canvas => {
                  this.side_canvas1 = side_canvas
                }}
                width={sidebar_image_size}
                height={sidebar_image_size}
              />
              <div
                style={{
                  background: hover_index1
                    ? `rgb(${color_array[mnist_labels[hover_index1]].join(',')})`
                    : 'transparent',
                  color: hover_index1 ? '#000' : '#fff',
                  padding: p(grem / 4, grem / 2),
                  display: 'flex',
                  justifyContent: 'space-between',
                  transition: 'all 0.1s linear',
                }}
              >
                <div>Label:</div>
                {hover_index1 ? <div>{mnist_labels[hover_index1]+1}</div> : null}
              </div>
              {/*
              <div
                style={{
                  padding: p(grem / 4, grem / 2),
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                Index:
                {hover_index1 ? <div>{hover_index1}</div> : null}
              </div>
              */}
            </div>
            <div>
              <canvas
                ref={side_canvas => {
                  this.side_canvas2 = side_canvas
                }}
                width={sidebar_image_size}
                height={sidebar_image_size}
              />
              <div
                style={{
                  background: hover_index2
                    ? `rgb(${color_array[mnist_labels[hover_index2]].join(',')})`
                    : 'transparent',
                  color: hover_index2 ? '#000' : '#fff',
                  padding: p(grem / 4, grem / 2),
                  display: 'flex',
                  justifyContent: 'space-between',
                  transition: 'all 0.1s linear',
                }}
              >
                <div>Label:</div>
                {hover_index2 ? <div>{mnist_labels[hover_index2]+1}</div> : null}
              </div>
              {/*
              <div
                style={{
                  padding: p(grem / 4, grem / 2),
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                Index:
                {hover_index2 ? <div>{hover_index2}</div> : null}
              </div>
              */}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection:'row',
              justifyContent:'space-evenly',
              flexGrow: 1,
            }}
          >
            <div>
              <button onClick={() =>{
                //this.props.clearIndex1(true)}
                u.Clear1()}
              }>
                Clear1
              </button>
            </div>
            <div>
              <button onClick={() =>{
                //this.props.clearIndex2(true)
                u.Clear2()}
              }>
                Clear2
              </button>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection:'row',
              justifyContent:'space-evenly',
              flexGrow: 1,
            }}
          >
            <div>
                <button onClick={() =>{
                  //this.props.clearIndex2(true)
                  this.props.mustLink(true)}
                }>
                   Must Link 
              </button>
            </div>
          </div>
        </div>
        <div style={{ padding: grem / 2 }}>
          <div>
            {' '}
            <button
              onClick={() => {
                this.props.toggleReset(true)
              }}
            >
              Reset Botton
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default Sidebar
