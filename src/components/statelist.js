import React from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import testCenters from '../data/testCenters';

export default function StateCenterMenu(props) {
  const [selectedIndex, setSelectedIndex] = React.useState('');
  const handleClick = (index) => {
    if (selectedIndex === index) {
      setSelectedIndex('');
    } else {
      setSelectedIndex(index);
    }
  };
  const statelist = [
    ...new Set(testCenters.map((locations) => locations.state)),
  ];
  let drawerMenuItemData = [];

  statelist.forEach((place) => {
    let cities = [];
    testCenters.forEach((obj) => {
      if (obj.state === place) cities.push(obj.city);
    });
    let statecityindex = {
      state: place,
      cities,
    };
    drawerMenuItemData.push(statecityindex);
  });
  return (
    <List component="nav">
      {drawerMenuItemData.map((item, index) => {
        return (
          <List key={index}>
            <ListItem
              key={index}
              button
              onClick={() => {
                handleClick(index);
              }}
            >
              <ListItemText primary={item.state} />
              {index === selectedIndex ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={index === selectedIndex} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {item.cities.map((sub, index) => {
                  // console.log(item);
                  return (
                    <ListItem
                      button
                      key={index}
                      onClick={() => {
                        console.log(sub + index);
                        props.handleStateClick(sub);
                      }}
                    >
                      <ListItemText primary={sub} key={sub} />
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </List>
        );
      })}
    </List>
  );
}
