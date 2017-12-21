import {diff} from 'deep-diff'
import * as _ from 'lodash'
import Notifier from './Notifier'


export default class MagicalStore {
  private state: {[key: string]: any} = {}
  public notifier = new Notifier

  constructor(private source: {[key: string]: any}) {
    this.configureState()
    this.configureAction()
  }

  private configureState() {
    const stateKeys = Object.keys(this.source)
    for (let stateKey of stateKeys) {
      this.state[stateKey] = _.cloneDeep(this.source[stateKey])

      Object.defineProperty(this, stateKey, {
        get: () => this.state[stateKey],
        set: (value: any) => {
          this.state[stateKey] = value
        }
      })
    }
  }

  private configureAction() {
    const actionNames = Object.getOwnPropertyNames(Object.getPrototypeOf(this.source))
    for (let actionName of actionNames) {
      const action = this.source[actionName].bind(this)
      const isSync = action.constructor.name !== 'AsyncFunction';

      (this as any)[actionName] = function(...args: any[]) {
        console.log(
          'clax',
          `${isSync ? 'sync' : 'async'} action invoked`,
          `${this.source.constructor.name}#${actionName}(${args.join(', ')})`
        )

        let oldState
        if (isSync) {
          oldState = _.cloneDeep(this.state)
        }

        action(...args)

        if (isSync) {
          const changes = diff(oldState, this.state)
          console.log('clax', 'state changed', changes)
          this.notifier.notify()
        }
      }.bind(this)
    }
  }
}