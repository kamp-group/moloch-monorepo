import React from "react";
import { Grid, Button, Segment, Modal, Form } from "semantic-ui-react";
import { Link } from "react-router-dom";
import Graph from "./Graph";
import moment from 'moment';
import gql from "graphql-tag";
import { Query } from "react-apollo";
import { getToken } from "../web3";

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
});

const GET_MEMBERS = gql`
  {
    members(where: { shares_gt: 0, isActive: true }) {
      id
    }
  }
`;
const NumMembers = () => (
  <Query query={GET_MEMBERS}>
    {({ loading, error, data }) => {
      let members;
      if (error) {
        members = "NA";
        console.error(`Could not load members: ${error}`);
      } else if (loading) {
        members = "-";
      } else {
        members = data.members.length;
      }
      return (
        <Link to="/members" className="link">
          <Button size="large" color="grey" className="btn_link">
            {members} Members
          </Button>
        </Link>
      );
    }}
  </Query>
);

// TODO filter this to get current proposals?
const GET_PROPOSALS = gql`
  {
    proposals {
      id
    }
  }
`;
const NumProposals = () => (
  <Query query={GET_PROPOSALS}>
    {({ loading, error, data }) => {
      let proposals;
      if (error) {
        proposals = "NA";
        console.error(`Could not load proposals: ${error}`);
      } else if (loading) {
        proposals = "-";
      } else {
        proposals = data.proposals.length;
      }
      return (
        <Link to="/proposals" className="link">
          <Button size="large" color="grey" className="btn_link">
            {proposals} Proposals
          </Button>
        </Link>
      );
    }}
  </Query>
);

class HomePage extends React.Component {
  state = {
    approval: "",
    token: null,
    userAddress: null,
    guildBankValue: 0,
    ethAmount: 0,
    totalShares: 0
  };

  async componentDidMount() {
    const token = await getToken();
    let loggedUser = JSON.parse(localStorage.getItem("loggedUser"));
    this.setState({
      token,
      userAddress: loggedUser.address
    });
  }

  handleChange = (e) => this.setState({ approval: e.target.value });

  handleSubmit = () => {
    const { approval, token, userAddress } = this.state;
    token.methods.approve(process.env.REACT_APP_MOLOCH_ADDRESS, approval).send({ from: userAddress });
  };

  render() {
    const { approval } = this.state;
    return (
      <div id="homepage">
        <Grid columns={16} verticalAlign="middle">
          <Grid.Row>
            <Grid.Column>
              <Modal
                basic
                size="small"
                trigger={
                  <Button size="large" color="grey" className="btn_link">
                    Approve wETH
                  </Button>
                }
              >
                <Modal.Header>Approve wETH</Modal.Header>
                <Modal.Content>
                  <Form onSubmit={this.handleSubmit}>
                    <Form.Field>
                      <label>Amount to Approve</label>
                      <input placeholder="Amount in Wei" name="amount" value={approval} onChange={this.handleChange} className="asset_amount" />
                    </Form.Field>
                    <Button type="submit" color="grey" className="btn_link">
                      Submit
                    </Button>
                  </Form>
                </Modal.Content>
              </Modal>
            </Grid.Column>
          </Grid.Row>
          <Grid.Column mobile={16} tablet={6} computer={4} className="guild_value">
            <Link to="/guildbank" className="text_link">
              <p className="subtext">Guild Bank Value</p>
              <p className="amount">{formatter.format(typeof(this.state.guildBankValue) === 'number' && this.state.guildBankValue >= 0 ? this.state.guildBankValue : 0) }</p>
            </Link>
          </Grid.Column>
          <Grid.Column mobile={16} tablet={10} computer={8} textAlign="center" className="browse_buttons">
            <NumMembers />
            <NumProposals />
          </Grid.Column>

          <Grid.Column computer={4} />

          <Grid.Column width={16}>
            <Segment className="blurred box">
              <Grid columns="equal" className="graph_values">
                <Grid.Column textAlign="left">
                  <p className="subtext">Total Shares</p>
                  <p className="amount">{this.state.totalShares}</p>
                </Grid.Column>
                <Grid.Column textAlign="center">
                  <p className="subtext">Total ETH</p>
                  <p className="amount">{this.state.ethAmount}</p>
                </Grid.Column>
                <Grid.Column textAlign="right">
                  <p className="subtext">Share Value</p>
                  <p className="amount">{formatter.format(typeof(this.state.shareValue) === 'number' && this.state.shareValue >= 0 ? this.state.shareValue : 0) }</p>
                </Grid.Column>
              </Grid>
              <div className="graph">
                <Graph />
              </div>
            </Segment>
          </Grid.Column>
        </Grid>
      </div>
    );
  }
}

export default HomePage;
