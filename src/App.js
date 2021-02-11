import logo from './logo.svg';
import './App.css';
import React from 'react';
import ReactDOM from 'react-dom';

const HOST = "find-cards.com/api"; 
const API_SEARCH = `https://${HOST}/search?key=`;
const API_STATS = `https://${HOST}/stats`;

// const HOST = "localhost:8000";
// const API_SEARCH = `http://${HOST}/search?key=`;
// const API_STATS = `http://${HOST}/stats`;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      serverVersion: 0,
      siteCount: 0,
      deckCount: 0,
    }
  }

  componentDidMount() {
    fetch(API_STATS)
      .then(res => res.json())
      .then((data) => {
        this.setState({
          serverVersion: data.version,
          siteCount: data.site_count,
          deckCount: data.deck_count,
        })
      })
      .catch((e) => {
        console.error(e);
      })
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
        <img className="Logo" src={logo} alt="logo" />
          <div className="App-logo">find-cards.com</div>
          <p class="TagLine">Over {this.state.deckCount - (this.state.deckCount % 1000)} decks indexed across {this.state.siteCount} vendors</p>
          <SearchArea />
        </header>
        <a className="NavLink" href="#root">Back to top</a>
        <footer className="App-footer">
          {this.state && this.state.serverVersion ? `v${this.state.serverVersion}` : '-'} | Copyright {new Date().getFullYear()}, SciEnt | Logo supplied by <a className="FooterLink" href="https://www.vecteezy.com/free-vector/playing-card-icons">Playing Card Icons Vectors by Vecteezy</a>
        </footer>
      </div>
    );
  }
}

class SearchForm extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <form onSubmit={(e) => this.props.onSubmit(e)}>
        <div className="FormContainer">
          <input 
            className="SearchField" 
            name="searchfield"
            onChange={(e) => this.props.onChange(e)}
            type="text" 
            placeholder="Enter name of a deck here" 
          />
          <button
            className="SearchButton"
            onClick={(e) => this.props.onSubmit(e)}
          >Search</button>
        </div>
      </form>
    )
  }
}

class ResultsArea extends React.Component {
  constructor(props) {
    super(props);
  }

  renderItems(items) {
    let results = null;
    if (items) {
      results = items.map((item, index) => {
        return (
          <div key={item.url} className="ResultItem">
            <a className="DeckLink" href={item.url} target="_blank">
              <img className="Thumbnail" src={item.image_url} />
              <p className="DeckName">{item.deck_name}</p>
              <p className="DeckPrice">{item.currency}{item.price}</p>
              <p className="SiteUrl">{item.site}</p>
            </a>      
          </div>
        )
      });
    }

    return results;
  }

  render() {
    const results = this.props.results;
    let label;
    if (results) {
      label = results.length > 0 
              ? <p className="ResultLabel">Showing {results.length} results for &quot;{this.props.searchText}&quot;</p> 
              : <p className="ResultLabel">No results for &quot;{this.props.searchText}&quot;</p>
    } else {
      label = <p/>
    }
    const items = this.renderItems(results);

    return (
      <div>
        {label}        
        <div className="Results">
        {items}
      </div>
      </div>
    )
  }
}

class SearchArea extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchText: null,
      resultsText: null,
      results: null,
    }
  }

  handleChange(e) {
    this.setState({
      searchText: e.target.value,
    });
  }

  handleSubmit(e) {
    // make a call to the server to get the results
    fetch(`${API_SEARCH}${this.state.searchText}`)
      .then(res => res.json())
      .then((data) => {
        data.sort((a, b) => {
          let ap = parseFloat(a.price);
          let bp = parseFloat(b.price);
          if (ap < bp) return -1;
          if (ap > bp) return 1;
          return 0;
        });
        this.setState({
          resultsText: this.state.searchText,
          results: data.filter(deck => deck.available === true)
        })
      })
      .catch((e) => {
        console.error(e);
      })
    e.preventDefault();
  }

  render() {
    return (
      <div className="SearchArea">
        <SearchForm 
          onSubmit={(e) => this.handleSubmit(e)} 
          onChange={(e) => this.handleChange(e)} 
        />
        <ResultsArea searchText={this.state.resultsText} results={this.state.results}/>
      </div>
    )
  }
}

export default App;
