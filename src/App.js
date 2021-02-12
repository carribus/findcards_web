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
    this.submitTimerId = null;
    this.state = {
      searchText: null,
      resultText: null,
      results: null,
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

  handleSearchChange(e) {
    clearTimeout(this.submitTimerId);
    this.setState({
      searchText: e.target.value,
    });
    this.submitTimerId = setTimeout(() => {
      clearTimeout(this.submitTimerId);
      this.submitTimerId = null;
      this.submitSearch();
    }, 750)
  }

  submitSearch() {
    if (this.state.searchText.trim().length === 0) {
      return;
    }
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
          resultText: this.state.searchText,
          results: data.filter(deck => deck.available === true)
        })
      })
      .catch((e) => {
        console.error(e);
      })
  }

  handleSearchSubmit(e) {
    e.preventDefault();
    this.submitSearch();
  }  

  render() {
    return (
      <div className="App">
        <Header />
        <SearchArea 
          deckCount={this.state.deckCount} 
          siteCount={this.state.siteCount}
          onChange={(e) => this.handleSearchChange(e)} 
          onSubmit={(e) => this.handleSearchSubmit(e)}/>
        <FilterArea />
        <ResultsArea searchText={this.state.resultText} results={this.state.results}/>
        {/* <a className="NavLink" href="#root">Back to top</a> */}
        <footer className="App-footer">
          <a className="FooterLink" href="mailto:peter@find-cards.com">Contact Us</a><br/>
          {this.state && this.state.serverVersion ? `v${this.state.serverVersion}` : '-'} | Copyright {new Date().getFullYear()}, SciEnt | Logo supplied by <a className="FooterLink" href="https://www.vecteezy.com/free-vector/playing-card-icons">Playing Card Icons Vectors by Vecteezy</a>
        </footer>
      </div>
    );
  }
}

class Header extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="HeaderBar">
        <img className="Logo" src={logo} alt="logo" />
        <p className="LogoText">find-cards.com</p>
      </div>
    )
  }
}

class SearchArea extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="SearchArea">
        <SearchForm 
          deckCount={this.props.deckCount}
          siteCount={this.props.siteCount}
          onSubmit={(e) => this.props.onSubmit(e)} 
          onChange={(e) => this.props.onChange(e)} 
        />
        {/* <ResultsArea searchText={this.state.resultsText} results={this.state.results}/> */}
      </div>
    )
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
        <p className="TagLine">Over <b>{this.props.deckCount - (this.props.deckCount % 1000)}</b> decks indexed across <b>{this.props.siteCount}</b> vendors</p>
          <input 
            className="SearchField" 
            name="searchfield"
            autoComplete="off"
            onChange={(e) => this.props.onChange(e)}
            type="text" 
            placeholder="Enter name of a deck here" 
          />
          {/* <button
            className="SearchButton"
            onClick={(e) => this.props.onSubmit(e)}
          >Search</button> */}
        </div>
      </form>
    )
  }
}

class FilterArea extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="FilterArea">
      {/* <ResultsArea searchText={this.state.resultsText} results={this.state.results}/> */}
    </div>

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
      results = items.map((item) => {
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
      <div className="ResultsArea">
        {label}        
        <div className="Results">
          {items}
        </div>
      </div>
    )
  }
}


export default App;
