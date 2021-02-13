import logo from './logo.svg';
import './App.css';
import React from 'react';
import ReactDOM from 'react-dom';

const HOST = "find-cards.com/api"; 
const PROTOCOL = "https";

// const HOST = "localhost:8000";
// const PROTOCOL = "http";

// API Endpoints
const API_SEARCH = `${PROTOCOL}://${HOST}/search?key=`;
const API_POPULAR_SEARCHES = `${PROTOCOL}://${HOST}/search/popular?limit=`;
const API_RECENT_SEARCHES = `${PROTOCOL}://${HOST}/search/recent?limit=`;
const API_STATS = `${PROTOCOL}://${HOST}/stats`;

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
          
          // sort by relevance first
          if (a.relevance > b.relevance) return -1;
          if (a.relevance < b.relevance) return 1;

          // then by price
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

  handleFilterPopularSearchesChange(e) {
    this.setState({
      searchText: e.target.value
    }, () => {
      this.submitSearch();
    });
  }

  render() {
    return (
      <div className="App">
        <Header />
        <SearchArea 
          deckCount={this.state.deckCount} 
          siteCount={this.state.siteCount}
          searchText={this.state.searchText}
          onChange={(e) => this.handleSearchChange(e)} 
          onSubmit={(e) => this.handleSearchSubmit(e)}/>
        <FilterArea onChange={(e) => this.handleFilterPopularSearchesChange(e)}/>
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
        <div className="HeaderBrand">
          <img className="Logo" src={logo} alt="logo" />
          <p className="LogoText">find-cards.com</p>
        </div>
        <div className="HeaderBlurb">
          <p className="Blurb">Find playing cards at the best possible prices!</p>
        </div>
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
          searchText={this.props.searchText}
          deckCount={this.props.deckCount}
          siteCount={this.props.siteCount}
          onSubmit={(e) => this.props.onSubmit(e)} 
          onChange={(e) => this.props.onChange(e)} 
        />
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
            value={this.props.searchText ? this.props.searchText : ""}
          />
        </div>
      </form>
    )
  }
}

class FilterArea extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchLimit: 10,
      popularSearches: [],
      recentSearches: [],
    }
  }

  fetchPopularSearches() {
    fetch(API_POPULAR_SEARCHES+this.state.searchLimit)
      .then(res => res.json())
      .then((data) => {
        this.setState({
          popularSearches: data,
        });
      })
      .catch((e) => {
        console.error(e);
      });
  }

  fetchRecentSearches() {
    fetch(API_RECENT_SEARCHES+this.state.searchLimit)
      .then(res => res.json())
      .then((data) => {
        this.setState({
          recentSearches: data,
        });
      })
      .catch((e) => {
        console.error(e);
      });
  }

  componentDidMount() {
    this.fetchPopularSearches();
    this.fetchRecentSearches();
  }

  renderPopularSearchItems(limit) {
    let result = null;
    if (this.state.popularSearches.length > 0) {
      let popularSearches = this.state.popularSearches.slice();
      result = popularSearches.map((item, index) => {
        return (
          <option key={index} value={item.search_text}>{item.search_text}</option>
        )
      })
    }

    return result;
  }

  renderRecentSearchItems(limit) {
    let result = null;
    if (this.state.recentSearches.length > 0) {
      let recentSearches = this.state.recentSearches.slice();
      result = recentSearches.map((item, index) => {
        return (
          <option key={index} value={item.search_text}>{item.search_text}</option>
        )
      })
    }

    return result;
  }

  render() {
    return (
      <div className="FilterArea">
        <select id="top_searches" className="DropdownFilter" defaultValue="--" onChange={(e) => this.props.onChange(e)}>
          <option disabled value="--">Top 10 Searches</option>
          {this.renderPopularSearchItems(this.state.searchLimit)}
        </select>
        <select id="recent_searches" className="DropdownFilter" defaultValue="--" onChange={(e) => this.props.onChange(e)}>
          <option disabled value="--">Recent Searches</option>
          {this.renderRecentSearchItems(this.state.searchLimit)}
        </select>
      </div>
    )
  }
}

class ResultsArea extends React.Component {
  constructor(props) {
    super(props);
  }

  filter_items(items) {
    let top_score = 0;
    if (items && items.length) {
      top_score = items[0].relevance;
    }

    return items.filter((item) => {
      return item.url.length > 0 && item.relevance == top_score
    });
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
    let label;
    let results;
    if (this.props.results) {
      results = this.filter_items(this.props.results);
      label = results.length > 0 
              ? <p className="ResultLabel">Showing {results.length} results for &quot;{this.props.searchText}&quot;</p> 
              : <p className="ResultLabel">No results for &quot;{this.props.searchText}&quot;</p>
    } else {
      label = <p/>
    }

    const items = results ? this.renderItems(results) : [];

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
