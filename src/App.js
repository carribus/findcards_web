import logo from './fc-logo-256x256.png';
import './App.css';
import React from 'react';
import ReactDOM from 'react-dom';
import userEvent from '@testing-library/user-event';

const HOST = "find-cards.com/api";
const PROTOCOL = "https";

// const HOST = "localhost:8000";
// const PROTOCOL = "http";

// API Endpoints
const API_SEARCH = `${PROTOCOL}://${HOST}/search?key=`;
const API_POPULAR_SEARCHES = `${PROTOCOL}://${HOST}/search/popular?limit=`;
const API_RECENT_SEARCHES = `${PROTOCOL}://${HOST}/search/recent?limit=`;
const API_STATS = `${PROTOCOL}://${HOST}/stats`;
const API_EVENT_POST = `${PROTOCOL}://${HOST}/data/event`
const API_AFFILIATE_PRODUCTS = `${PROTOCOL}://${HOST}/aff/products`;

// CURRENCY API
const API_EXCHANGE_RATES = "https://api.exchangeratesapi.io";

// GEO IP LOCATION API
const API_GEOIP = "https://extreme-ip-lookup.com/json"

function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

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
      sites: [],
      sites_visible: false,
      regions: [],
      exchangeRates: {},
      targetCurrency: null,
      geoData: {
        countryCode: null,
        continent: null,
        region: null,
      },
    }
  }

  componentDidMount() {
    const get_unique_regions = (sites) => {
      let regions = [];
      sites.map((site) => {
        if (regions.indexOf(site.region) == -1) {
          regions.push(site.region);
        }
      });

      regions.sort((a, b) => {
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
      })

      return regions;
    };

    fetch(API_STATS)
      .then(res => res.json())
      .then((data) => {
        this.setState({
          serverVersion: data.version,
          siteCount: data.sites.length,
          deckCount: data.deck_count,
          sites: data.sites.map((site) => {
            return {
              label: site.label,
              url: site.url,
              currency: site.currency,
              region: site.region,
            }
          }).sort((a, b) => {
            return a.label > b.label ? 1 : a.label < b.label ? -1 : 0;
          }),
          regions: get_unique_regions(data.sites),
          selectedRegion: 'All',
        })
      })
      .catch((e) => {
        console.error(e);
      })

      fetch(API_GEOIP)
        .then(res => res.json())
        .then((data) => {
          this.setState({
            geoData: {
              countryCode: data.countryCode,
              continent: data.continent,
              region: data.region,
            }
          })
        })
  }

  handleTargetCurrencyChange(curr) {
    let target = null;

    if (this.state.targetCurrency != curr) {
      target = curr;
    }

    this.setState({
      targetCurrency: target,
      rates: null,
    }, () => {
      this.fetchCurrencyPairs(target);
    })
  }

  fetchCurrencyPairs(baseCurrency) {
    let today = new Date();
    let url = `${API_EXCHANGE_RATES}/${today.getFullYear()}-${today.getUTCMonth() + 1}-${today.getUTCDate()}?base=${baseCurrency}`

    // make sure that we don't refetch exchange rates that we already have
    if (!this.state.exchangeRates[baseCurrency]) {
      let er = { ...this.state.exchangeRates };

      fetch(url)
        .then(res => res.json())
        .then((data) => {
          er[baseCurrency] = data.rates;
          this.setState({
            exchangeRates: er,
          })
        })
        .catch((e) => {
          console.error(e);
        })
    }
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
    if (this.state.searchText == this.state.resultText) {
      if (this.submitTimerId) clearTimeout(this.submitTimerId);
      this.submitTimerId = null;
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
          results: data.map(deck => {
            deck.price = deck.price.replace(",", ".");
            return deck;
          })
            .filter(deck => deck.available === true)
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

  handleRegionChange(e) {
    this.setState({
      selectedRegion: e.target.value
    })
  }

  onShowSiteList(e) {
    console.log("Site List");
    let sites_visible = this.state.sites_visible;
    this.setState({
      sites_visible: !sites_visible,
    })
    e.preventDefault();
  }

  render() {
    return (
      <div className="App">
        <h1 class="Hidden">find-cards.com: Find Playing Cards at the best prices from dozens of different online stores</h1>
        <SiteList
          sites={this.state.sites}
          visible={this.state.sites_visible}
          onClose={(e) => this.onShowSiteList(e)} />
        <Header />
        <SearchArea
          deckCount={this.state.deckCount}
          siteCount={this.state.siteCount}
          searchText={this.state.searchText}
          targetCurrency={this.state.targetCurrency}
          onTargetCurrencyChange={(e) => this.handleTargetCurrencyChange(e)}
          onChange={(e) => this.handleSearchChange(e)}
          onSubmit={(e) => this.handleSearchSubmit(e)} />
        <FilterArea
          regions={this.state.regions}
          onChange={(e) => this.handleFilterPopularSearchesChange(e)}
          onRegionChange={(e) => this.handleRegionChange(e)}
        />
        <ResultsArea
          geoData={this.state.geoData}
          region={this.state.selectedRegion}
          sites={this.state.sites}
          searchText={this.state.resultText}
          targetCurrency={this.state.targetCurrency}
          exchangeRates={this.state.exchangeRates}
          results={this.state.results}
        />
        <Footer
          serverVersion={this.state.serverVersion}
          onShowSiteList={(e) => this.onShowSiteList(e)}
        />
      </div>
    );
  }
}

class SiteList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      yOffset: window.pageYOffset,
    }
  }

  componentDidMount() {
    window.addEventListener('scroll', (e) => {
      this.setState({
        yOffset: window.pageYOffset,
      })
    })
  }

  renderSiteList() {
    return this.props.sites.map((site) => {
      return (
        <li key={site.label}><a href={site.url}>{site.label}</a></li>
      )
    })
  }

  render() {
    let width = window.innerWidth * 0.6;
    let height = window.innerHeight * 0.6;
    let top = window.innerHeight / 2 - height / 2 + this.state.yOffset;
    let left = 50 + '%';
    let marginLeft = -width / 2;
    let display = this.props.visible ? "block" : "none";

    return (
      <div className="SiteList" style={{ display, width, height, top, left, marginLeft, position: 'absolute' }}>
        <div>
          <button onClick={(e) => this.props.onClose(e)} className="CloseButton">X</button>
        </div>
        <p>
          The following {this.props.sites.length} online stores are currently supported by find-cards.com.<br />
          If you would like a site added, <a href="mailto:peter@find-cards.com">send us a mail</a>
        </p>
        <div className="ScrollablePanel">
          <ul>
            {this.renderSiteList()}
          </ul>
        </div>
      </div>
    )
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
          <img className="Logo" src={logo} alt="find-cards logo" />
          <p className="LogoText">find-cards.com</p>
        </div>
        <div className="HeaderBlurb">
          <h1 className="Blurb">Find playing cards at the best possible prices!</h1>
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
        <CurrencySelectors
          targetCurrency={this.props.targetCurrency}
          onTargetCurrencyChange={(e) => this.props.onTargetCurrencyChange(e)}
        />
      </div>
    )
  }
}

class CurrencySelectors extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let renderCurrencyButtons = () => {
      return ['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map((curr) => {
        let classes = ["CurrencyButton"];
        if (this.props.targetCurrency == curr) {
          classes.push("SelectedCurrencyButton");
        }
        return (
          <button
            key={curr}
            className={classes.join(' ')}
            onClick={() => this.props.onTargetCurrencyChange(curr)}
          >
            {curr}
          </button>
        )
      });
    };
    return (
      <div>
        {renderCurrencyButtons()}
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
          <p className="TagLine">Over <b>{formatNumber(this.props.deckCount - (this.props.deckCount % 1000))}</b> decks indexed across <b>{this.props.siteCount}</b> shops</p>
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
    fetch(API_POPULAR_SEARCHES + this.state.searchLimit)
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
    fetch(API_RECENT_SEARCHES + this.state.searchLimit)
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

  renderRegionItems() {
    let regions = this.props.regions.slice();
    return regions.map((item) => {
      return (
        <option key={item} value={item}>{item}</option>
      )
    })
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
        <select id="region" className="DropdownFilter" defaultValue="All" onChange={(e) => this.props.onRegionChange(e)}>
          <option value="All">All Regions</option>
          {this.renderRegionItems()}
        </select>
      </div>
    )
  }
}

class ResultsArea extends React.Component {
  constructor(props) {
    super(props);
  }

  // keeps only relevant items (where the relevance score is equal to the number of worlds)
  filter_relevant_items(items) {
    let top_score = 0;
    if (items && items.length) {
      top_score = items[0].relevance;
    }

    return items.filter((item) => {
      return item.url.length > 0 && item.relevance == top_score && this.isItemInRegion(item)
    });
  }

  filter_suggestions(items) {
    let top_score = 0;
    if (items && items.length) {
      top_score = items[0].relevance;
    }

    return items.filter((item) => {
      return item.url.length > 0 && item.relevance < top_score && this.isItemInRegion(item)
    });
  }

  isItemInRegion(item) {
    return this.props.sites.find((site) => {
      return this.props.region == 'All' || (site.url == item.site && site.region == this.props.region)
    })
  }

  siteFromURL(url) {
    let site = this.props.sites.find((site) => {
      return site.url == url;
    });
    return site.label;
  }

  onLinkClick(item) {
    let event = {
      event_type: 'product_click',
      data: {
        item: item.item,
        search_text: this.props.searchText,
      }
    };

    fetch(API_EVENT_POST, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    }, (e) => {
      console.log(e);
      console.log('click submitted');
    })
  }

  currencySymbolToCode(symbol) {
    switch (symbol) {
      case "$": return 'USD';
      case "€": return 'EUR';
      case "£": return 'GBP';
      case "A$": return 'AUD';
      default: return symbol;
    }
  }

  currencyCodeToSymbol(code) {
    switch (code) {
      case "USD": return '$';
      case "EUR": return '€';
      case "GBP": return '£';
      case "AUD": return 'A$';
      default: return code;
    }
  }

  convertToTargetCurrency(item) {
    let rates = this.props.exchangeRates[this.props.targetCurrency];
    if (rates) {
      let itemCurrency = this.currencySymbolToCode(item.currency);

      rates[this.props.targetCurrency] = 1;

      return (item.price * (1 / rates[itemCurrency])).toFixed(2);
    }
  }

  renderItems(items, itemClass = "ResultItem") {
    let results = null;
    if (items) {
      results = items
        .filter((item) => this.isItemInRegion(item))
        .map((item) => {
          let new_item = { ...item };
          if (this.props.targetCurrency) {
            new_item.price = this.convertToTargetCurrency(item);
            new_item.currency = this.currencyCodeToSymbol(this.props.targetCurrency);
          }
          return new_item;
        })
        .sort((a, b) => a.price - b.price)
        .map((item) => {
          let siteName = this.siteFromURL(item.site);
          return (
            <div key={item.url} className={itemClass}>
              <a className="DeckLink" href={item.url} target="_blank" onClick={(e) => this.onLinkClick({ item })}>
                <img className="Thumbnail" src={item.image_url} />
                <p className="DeckName">{item.deck_name}</p>
                <p className="DeckPrice">{item.currency} {item.price}</p>
                <p className="SiteUrl">{siteName}</p>
              </a>
            </div>
          )
        });
    }

    return results;
  }

  renderSelectedRegion() {
    if (this.props.region == "All") {
      return "globally"
    } else {
      return `in ${this.props.region}`;
    }
  }

  render() {
    let labelResults, labelSuggestions;
    let results, suggestions;

    if (this.props.results) {
      results = this.filter_relevant_items(this.props.results);
      suggestions = this.filter_suggestions(this.props.results);
      labelResults = results.length > 0
        ? <p className="ResultLabel">Showing {formatNumber(results.length)} matches for &quot;{this.props.searchText}&quot; {this.renderSelectedRegion()}</p>
        : <p className="ResultLabel">No results for &quot;{this.props.searchText}&quot;</p>
      labelSuggestions = suggestions.length > 0
        ? <p className="SuggestionLabel">Showing {formatNumber(suggestions.length)} alternative suggestions {this.renderSelectedRegion()}</p>
        : <p />
    } else {
      labelResults = <p />
    }

    const items = results ? this.renderItems(results) : [];
    const suggested_items = results ? this.renderItems(suggestions, "SuggestionItem") : [];

    return (
      <div className="ResultsArea">
        {labelResults}
        <div className="Results">
          {items}
        </div>
        <AmazonProductBar geoData={this.props.geoData}/>
        {labelSuggestions}
        <div className="Results">
          {suggested_items}
        </div>
      </div>
    )
  }
}

class AmazonProductBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      productList: [],
      displayedProducts: [],
    }
  }

  componentDidMount() {
    fetch(API_AFFILIATE_PRODUCTS)
      .then(res => res.json())
      .then((data) => {
        this.setState({
          productList: data.products,
          displayedProducts: [],
        });
      })
      .catch((e) => {
        console.error(e);
      });
  }

  renderProductLinks() {
    if (this.state.displayedProducts.length == 0) {
      if (this.state.productList.length > 0 ) {
        let links = this.state.productList.slice().filter((product) => {
          let result = false;
          switch (this.props.geoData.countryCode) {
            case "GB": {
              result = product.country == 'UK'; 
              break;
            }
            default: {
              result = product.country == 'US'; 
              break;
            }
          }
          return result;
        });
        let itemWidth = 120, itemHeight = 240;
        let windowWidth = window.innerWidth;
        let itemCount = Math.floor(windowWidth / itemWidth)-1;
        let product_links = [];
    
        for (let i = 0; i < Math.min(7, itemCount); i++) {
          let count = links.length;
          let index = Math.floor(Math.random()*count);
          let item = links.splice(index, 1)[0];
          product_links.push(
            <iframe key={item.link}
              style={{ width: itemWidth+"px", height: itemHeight + "px" }}
              marginWidth="0"
              marginHeight="0"
              scrolling="no"
              frameBorder="0"
              src={item.link}>
            </iframe>
          )
        }

        this.setState({
          displayedProducts: product_links,
        });
        return product_links;
      } else {
        return <div></div>  
      }
    } else {
      return this.state.displayedProducts;
    }
  
  }

  render() {
    let productLinks = this.renderProductLinks();

    if (productLinks.length > 0) {
      return (
        <div className="AmazonProducts">
          <p>Other suggestions on Amazon</p>
          {productLinks.map(item => item)}
          <p className="BlurbSmall">As an Amazon Associate I earn from qualifying purchases.</p>
        </div>
      )
    } else {
      return <div></div>
    }
  }
}

class Footer extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <footer className="App-footer">
        <center>
          <a href="https://www.producthunt.com/posts/find-cards?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-find-cards" target="_blank">
            <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=284756&theme=light" alt="find-cards - Find the playing cards you want at the best price | Product Hunt" style={{ width: "180px", height: "auto", display: "block", position: "static" }} />
          </a>
        </center>
        <div style={{ "marginTop": "10px" }}>
          <a className="FooterLink" href="mailto:peter@find-cards.com">Contact Us</a> | <a className="FooterLink" href="" onClick={(e) => this.props.onShowSiteList(e)}>Supported Sites</a><br />
          {this.props.serverVersion ? `v${this.props.serverVersion}` : '-'} | Copyright {new Date().getFullYear()}, SciEnt | Logo designed by <a className="FooterLink" href="https://www.behance.net/melvinmercier">Melvin Mercier</a>
        </div>
      </footer>

    )

  }
}

export default App;
