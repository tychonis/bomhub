import "./SiteHeader.css"

import Search from "antd/es/input/Search";
import tychonisLogo from "assets/logo.png"
import { Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";


export const SiteHeader = ()=> {
    return (
        <div className="site-header">
            <img src={tychonisLogo} className="header-logo" alt="Tychonis logo" />
            <Search placeholder="Search part number etc" className="header-search"/>
            <div className="header-avatar">
                <Avatar icon={<UserOutlined />} />
            </div>
        </div>
    )
};