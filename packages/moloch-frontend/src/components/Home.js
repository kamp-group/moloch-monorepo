import React from "react";
import { Grid, Button, Segment, Modal, Form, Statistic } from "semantic-ui-react";
import { Link } from "react-router-dom";
import { Query } from "react-apollo";
import { getToken } from "../web3";
import { utils } from "ethers";
import { GET_METADATA, GET_MEMBERS, GET_PROPOSALS } from "../helpers/graphQlQueries";
import { convertWeiToDollars } from "../helpers/currency";
import { adopt } from "react-adopt";

const Composed = adopt({
  members: ({ render }) => <Query query={GET_MEMBERS}>{render}</Query>,
  proposals: ({ render }) => <Query query={GET_PROPOSALS}>{render}</Query>,
  metadata: ({ render }) => <Query query={GET_METADATA}>{render}</Query>
});

const NumMembers = ({ members, loading }) => (
  <Link to="/members" className="link">
    <Button size="large" color="grey" className="btn_link">
      {loading ? '...' : members.length} Members
    </Button>
  </Link>
);

const NumProposals = ({ proposals, loading }) => (
  <Link to="/proposals" className="link">
    <Button size="large" color="grey" className="btn_link">
      {loading ? '...' : proposals.length} Proposals
    </Button>
  </Link>
);

export default class HomePage extends React.Component {
  state = {
    approval: "",
    token: null,
    userAddress: null
  };

  async componentDidMount() {
    const { loggedInUser } = this.props
    const token = await getToken(loggedInUser);

    this.setState({
      token
    });
  }

  handleChange = e => this.setState({ approval: e.target.value });

  handleSubmit = async () => {
    const { approval, token } = this.state;
    console.log("Approving wETH: ", process.env.REACT_APP_MOLOCH_ADDRESS, utils.parseEther(approval).toString())
    const tx = await token.approve(process.env.REACT_APP_MOLOCH_ADDRESS, utils.parseEther(approval));
    console.log('tx: ', tx);
  };

  render() {
    const { approval } = this.state;
    return (
      <Composed>
        {({ members, proposals, metadata }) => {
          if (metadata.loading) return <Segment className="blurred box">Loading...</Segment>;

          let membersLoading = false
          if (members.loading) {
            membersLoading = true
          }

          let proposalsLoading = false
          if (proposals.loading) {
            proposalsLoading = true
          }

          if (members.error) throw new Error(`Error!: ${members.error}`);
          if (proposals.error) throw new Error(`Error!: ${proposals.error}`);
          if (metadata.error) throw new Error(`Error!: ${metadata.error}`);
          const { guildBankValue, exchangeRate, totalShares, shareValue } = metadata.data;
          return (
            <div id="homepage">
              <Grid columns={16} verticalAlign="middle">
                <Grid.Column mobile={16} tablet={6} computer={4} className="guild_value">
                  {/* <Link to="/guildbank" className="text_link"> */}
                  <Statistic inverted label="Guild Bank Value" value={convertWeiToDollars(guildBankValue, exchangeRate)} />
                  {/* </Link> */}
                </Grid.Column>
                <Grid.Column mobile={16} tablet={10} computer={8} textAlign="center" className="browse_buttons">
                  <NumMembers members={members.data.members} loading={membersLoading} />
                  <NumProposals proposals={proposals.data.proposals} loading={proposalsLoading} />
                </Grid.Column>
                <Grid.Column mobile={16} tablet={6} computer={4} className="guild_value">
                  <Modal
                    basic
                    size="small"
                    trigger={
                      <Button size="large" color="grey" className="browse_buttons">
                        Approve wETH
                      </Button>
                    }
                  >
                    <Modal.Header>Approve wETH</Modal.Header>
                    <Modal.Content>
                      <Form onSubmit={this.handleSubmit}>
                        <Form.Field>
                          <label>Amount to Approve</label>
                          <input placeholder="Amount in ETH" name="amount" value={approval} onChange={this.handleChange} className="asset_amount" />
                        </Form.Field>
                        <Button type="submit" color="grey" className="btn_link">
                          Submit
                        </Button>
                      </Form>
                    </Modal.Content>
                  </Modal>
                </Grid.Column>

                <Grid.Column width={16}>
                  <Segment className="blurred box">
                    <Grid columns="equal" className="graph_values">
                      <Grid.Column textAlign="left">
                        <Statistic inverted label="Total Shares" value={totalShares} />
                      </Grid.Column>
                      <Grid.Column textAlign="center">
                        <Statistic inverted label="Total ETH" value={utils.formatEther(guildBankValue)} />
                      </Grid.Column>
                      <Grid.Column textAlign="right">
                        <Statistic inverted label="Share Value" value={convertWeiToDollars(shareValue, exchangeRate)} />
                      </Grid.Column>
                    </Grid>
                  </Segment>
                </Grid.Column>
              </Grid>
            </div>
          );
        }}
      </Composed>
    );
  }
}
