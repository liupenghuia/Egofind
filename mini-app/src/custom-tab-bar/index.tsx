import { Component } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './index.scss';

type TabItem = {
  pagePath: string;
  text: string;
};

const tabs: TabItem[] = [
  { pagePath: '/pages/index/index', text: '首页' },
  { pagePath: '/pages/map/index', text: '发现' },
  { pagePath: '/pages/list/index', text: '行程' },
  { pagePath: '/pages/mine/index', text: '我的' },
];

type State = {
  selected: number;
  mode: 'passenger' | 'driver';
};

export default class CustomTabBar extends Component<{}, State> {
  state: State = {
    selected: 0,
    mode: 'passenger',
  };

  setSelected(index: number) {
    this.setState({ selected: index });
  }

  setMode(mode: 'passenger' | 'driver') {
    this.setState({ mode });
  }

  switchTab(index: number, path: string) {
    this.setState({ selected: index });
    Taro.switchTab({ url: path });
  }

  render() {
    const { selected, mode } = this.state;
    const activeColor = mode === 'driver' ? '#0b6e4f' : '#1677ff';
    return (
      <View className="tab-bar">
        {tabs.map((item, index) => {
          const active = selected === index;
          return (
            <View
              key={item.pagePath}
              className="tab-bar__item"
              onClick={() => this.switchTab(index, item.pagePath)}
            >
              <Text
                className="tab-bar__text"
                style={{ color: active ? activeColor : '#8c8c8c' }}
              >
                {item.text}
              </Text>
              {active ? (
                <View
                  className="tab-bar__dot"
                  style={{ background: activeColor }}
                />
              ) : null}
            </View>
          );
        })}
      </View>
    );
  }
}
