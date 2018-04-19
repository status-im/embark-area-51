class MenuItem extends React.Component {    
    render(){

        let classNames = "list-group-item list-group-item-action d-flex align-items-center ";
        let icon = "fe " + this.props.icon;
        if(this.props.target == this.props.selectedTab){
            classNames += "active";
        }

        return <a href="#" onClick={this.props.click} data-target={this.props.target} className={classNames}>
                <span className="icon mr-3"><i className={icon}></i></span>{this.props.text}
            </a>;
    }
}
