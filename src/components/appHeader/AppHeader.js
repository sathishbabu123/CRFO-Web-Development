import React from "react";
import AppBar from "@material-ui/core/AppBar";
import classNames from "classnames/bind";
const cx = classNames.bind(require("./appHeader.module.css"));
const AppHeader = props => {
  const { news } = props;
  return (
    <>
      <AppBar
        position="relative"
        className={cx("app-header")}
        color="primary"
        style={{ backgroundColor: "#efefef" }}
      >
        <a
          href="https://coronasafe.in/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            className={cx("logo")}
            src="./crfoLogo.svg"
            alt="CRFO Logo"
            height={80}
          />
        </a>
      </AppBar>
    </>
  );
};
export default AppHeader;
