import { useTranslation } from "react-i18next";
import { useEffect } from "react";

export default function DashboardHome() {
  const { t } = useTranslation();
  const tt = (k, d) => t(k) || d;

  useEffect(() => {
    // Ensure vendor scripts are loaded
    const tryInit = () => {
      const ready =
        typeof window !== "undefined" &&
        window.ApexCharts &&
        window.config &&
        typeof window.renderDashboardAnalytics === "function";
      if (ready) {
        try {
          window.renderDashboardAnalytics();
        } catch (e) {
          console.error("Failed to render dashboard analytics:", e);
        }
        return true;
      }
      return false;
    };

    if (!tryInit()) {
      const id = setInterval(() => {
        if (tryInit()) clearInterval(id);
      }, 50);
      return () => clearInterval(id);
    }
  }, []);

  return (
    <div>
      {/* Content */}
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="row">
          <div className="col-xxl-8 mb-6 order-0">
            <div className="card">
              <div className="d-flex align-items-start row">
                <div className="col-sm-7">
                  <div className="card-body">
                    <h5 className="card-title text-primary mb-3">
                      {tt('dashboard.congrats','Congratulations John! 🎉')}
                    </h5>
                    <p className="mb-6">
                      {tt('dashboard.salesBoost','You have done 72% more sales today.')}<br />
                      {tt('dashboard.checkBadge','Check your new badge in your profile.')}
                    </p>
                    <a href="#" className="btn btn-sm btn-label-primary">
                      {tt('dashboard.viewBadges','View Badges')}
                    </a>
                  </div>
                </div>
                <div className="col-sm-5 text-center text-sm-left">
                  <div className="card-body pb-0 px-0 px-md-6">
                    <img
                      src="/assets/img/illustrations/man-with-laptop.png"
                      height="175"
                      className="scaleX-n1-rtl"
                      alt="View Badge User"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-4 col-lg-12 col-md-4 order-1">
            <div className="row">
              <div className="col-lg-6 col-md-12 col-6 mb-6">
                <div className="card h-100">
                  <div className="card-body pb-4">
                    <span className="d-block fw-medium mb-1">{tt('dashboard.order','Order')}</span>
                    <h4 className="card-title mb-0">276k</h4>
                  </div>
                  <div id="orderChart" className="pb-3 pe-1"></div>
                </div>
              </div>
              <div className="col-lg-6 col-md-12 col-6 mb-6">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="card-title d-flex align-items-start justify-content-between mb-4">
                      <div className="avatar flex-shrink-0">
                        <img
                          src="/assets/img/icons/unicons/wallet-info.png"
                          alt="wallet info"
                          className="rounded"
                        />
                      </div>
                      <div className="dropdown">
                        <button
                          className="btn p-0"
                          type="button"
                          id="cardOpt6"
                          data-bs-toggle="dropdown"
                          aria-haspopup="true"
                          aria-expanded="false"
                        >
                          <i className="icon-base bx bx-dots-vertical-rounded text-body-secondary"></i>
                        </button>
                        <div
                          className="dropdown-menu dropdown-menu-end"
                          aria-labelledby="cardOpt6"
                        >
                          <a className="dropdown-item" href="#">
                            View More
                          </a>
                          <a className="dropdown-item" href="#">
                            Delete
                          </a>
                        </div>
                      </div>
                    </div>
                    <p className="mb-1">{tt('dashboard.sales','Sales')}</p>
                    <h4 className="card-title mb-3">$4,679</h4>
                    <small className="text-success fw-medium">
                      <i className="icon-base bx bx-up-arrow-alt"></i> +28.42%
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Total Revenue */}
          <div className="col-12 col-xxl-8 order-2 order-md-3 order-xxl-2 mb-6">
            <div className="card">
              <div className="row row-bordered g-0">
                <div className="col-lg-8">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <div className="card-title mb-0">
                      <h5 className="m-0 me-2">{t('dashboard.totalRevenue')}</h5>
                    </div>
                    <div className="dropdown">
                      <button
                        className="btn p-0"
                        type="button"
                        id="totalRevenue"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        <i className="icon-base bx bx-dots-vertical-rounded icon-lg text-body-secondary"></i>
                      </button>
                      <div
                        className="dropdown-menu dropdown-menu-end"
                        aria-labelledby="totalRevenue"
                      >
                        <a className="dropdown-item" href="#">{t('invoices.selectAll')}</a>
                        <a className="dropdown-item" href="#">{t('actions.reset')}</a>
                        <a className="dropdown-item" href="#">{t('actions.share')}</a>
                      </div>
                    </div>
                  </div>
                  <div id="totalRevenueChart" className="px-3"></div>
                </div>
                <div className="col-lg-4">
                  <div className="card-body px-xl-9 py-12 d-flex align-items-center flex-column">
                    <div className="text-center mb-6">
                      <div className="btn-group">
                        <button type="button" className="btn btn-label-primary">
                          {new Date().getFullYear() - 1}
                        </button>
                        <button
                          type="button"
                          className="btn btn-label-primary dropdown-toggle dropdown-toggle-split"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          <span className="visually-hidden">
                            Toggle Dropdown
                          </span>
                        </button>
                        <ul className="dropdown-menu">
                          <li>
                            <a className="dropdown-item" href="#">
                              2021
                            </a>
                          </li>
                          <li>
                            <a className="dropdown-item" href="#">
                              2020
                            </a>
                          </li>
                          <li>
                            <a className="dropdown-item" href="#">
                              2019
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div id="growthChart"></div>
                    <div className="text-center fw-medium my-6">
                      62% Company Growth
                    </div>

                    <div className="d-flex gap-11 justify-content-between">
                      <div className="d-flex">
                        <div className="avatar me-2">
                          <span className="avatar-initial rounded-2 bg-label-primary">
                            <i className="icon-base bx bx-dollar icon-lg text-primary"></i>
                          </span>
                        </div>
                        <div className="d-flex flex-column">
                          <small>{new Date().getFullYear() - 1}</small>
                          <h6 className="mb-0">$32.5k</h6>
                        </div>
                      </div>
                      <div className="d-flex">
                        <div className="avatar me-2">
                          <span className="avatar-initial rounded-2 bg-label-info">
                            <i className="icon-base bx bx-wallet icon-lg text-info"></i>
                          </span>
                        </div>
                        <div className="d-flex flex-column">
                          <small>{new Date().getFullYear() - 2}</small>
                          <h6 className="mb-0">$41.2k</h6>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/*/ Total Revenue */}
          <div className="col-12 col-md-8 col-lg-12 col-xxl-4 order-3 order-md-2">
            <div className="row">
              <div className="col-6 mb-6">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="card-title d-flex align-items-start justify-content-between mb-4">
                      <div className="avatar flex-shrink-0">
                        <img
                          src="/assets/img/icons/unicons/paypal.png"
                          alt="paypal"
                          className="rounded"
                        />
                      </div>
                      <div className="dropdown">
                        <button
                          className="btn p-0"
                          type="button"
                          id="cardOpt4"
                          data-bs-toggle="dropdown"
                          aria-haspopup="true"
                          aria-expanded="false"
                        >
                          <i className="icon-base bx bx-dots-vertical-rounded text-body-secondary"></i>
                        </button>
                        <div
                          className="dropdown-menu dropdown-menu-end"
                          aria-labelledby="cardOpt4"
                        >
                          <a className="dropdown-item" href="#">
                            View More
                          </a>
                          <a className="dropdown-item" href="#">
                            Delete
                          </a>
                        </div>
                      </div>
                    </div>
                    <p className="mb-1">Payments</p>
                    <h4 className="card-title mb-3">$2,456</h4>
                    <small className="text-danger fw-medium">
                      <i className="icon-base bx bx-down-arrow-alt"></i> -14.82%
                    </small>
                  </div>
                </div>
              </div>
              <div className="col-6 mb-6">
                <div className="card h-100">
                  <div className="card-body pb-0">
                    <span className="d-block fw-medium mb-1">Revenue</span>
                    <h4 className="card-title mb-0 mb-lg-4">425k</h4>
                    <div id="revenueChart"></div>
                  </div>
                </div>
              </div>
              <div className="col-12 mb-6">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center flex-sm-row flex-column gap-10 flex-wrap">
                      <div className="d-flex flex-sm-column flex-row align-items-start justify-content-between">
                        <div className="card-title mb-6">
                          <h5 className="text-nowrap mb-1">{t('dashboard.profileReport')}</h5>
                          <span className="badge bg-label-warning">
                            YEAR 2022
                          </span>
                        </div>
                        <div className="mt-sm-auto">
                          <span className="text-success text-nowrap fw-medium">
                            <i className="icon-base bx bx-up-arrow-alt"></i>{" "}
                            68.2%
                          </span>
                          <h4 className="mb-0">$84,686k</h4>
                        </div>
                      </div>
                      <div id="profileReportChart"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
    {/* Order Statistics */}
          <div className="col-md-6 col-lg-4 col-xl-4 order-0 mb-6">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between">
                <div className="card-title mb-0">
      <h5 className="mb-1 me-2">{t('dashboard.orderStatistics')}</h5>
      <p className="card-subtitle">42.82k {t('dashboard.totalSales')}</p>
                </div>
                <div className="dropdown">
                  <button
                    className="btn text-body-secondary p-0"
                    type="button"
                    id="orederStatistics"
                    data-bs-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <i className="icon-base bx bx-dots-vertical-rounded icon-lg"></i>
                  </button>
                  <div
                    className="dropdown-menu dropdown-menu-end"
                    aria-labelledby="orederStatistics"
                  >
                    <a className="dropdown-item" href="#">{t('invoices.selectAll')}</a>
                    <a className="dropdown-item" href="#">{t('actions.reset')}</a>
                    <a className="dropdown-item" href="#">{t('actions.share')}</a>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-6">
                  <div className="d-flex flex-column align-items-center gap-1">
                    <h3 className="mb-1">8,258</h3>
                    <small>{t('dashboard.totalOrders')}</small>
                  </div>
                  <div id="orderStatisticsChart"></div>
                </div>
                <ul className="p-0 m-0">
                  <li className="d-flex align-items-center mb-5">
                    <div className="avatar flex-shrink-0 me-3">
                      <span className="avatar-initial rounded bg-label-primary">
                        <i className="icon-base bx bx-mobile-alt"></i>
                      </span>
                    </div>
                    <div className="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                      <div className="me-2">
                        <h6 className="mb-0">{t('dashboard.categoryElectronic')}</h6>
                        <small>{t('dashboard.categoryElectronicDesc')}</small>
                      </div>
                      <div className="user-progress">
                        <h6 className="mb-0">82.5k</h6>
                      </div>
                    </div>
                  </li>
                  <li className="d-flex align-items-center mb-5">
                    <div className="avatar flex-shrink-0 me-3">
                      <span className="avatar-initial rounded bg-label-success">
                        <i className="icon-base bx bx-closet"></i>
                      </span>
                    </div>
                    <div className="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                      <div className="me-2">
                        <h6 className="mb-0">{t('dashboard.categoryFashion')}</h6>
                        <small>{t('dashboard.categoryFashionDesc')}</small>
                      </div>
                      <div className="user-progress">
                        <h6 className="mb-0">23.8k</h6>
                      </div>
                    </div>
                  </li>
                  <li className="d-flex align-items-center mb-5">
                    <div className="avatar flex-shrink-0 me-3">
                      <span className="avatar-initial rounded bg-label-info">
                        <i className="icon-base bx bx-home-alt"></i>
                      </span>
                    </div>
                    <div className="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                      <div className="me-2">
                        <h6 className="mb-0">{t('dashboard.categoryDecor')}</h6>
                        <small>{t('dashboard.categoryDecorDesc')}</small>
                      </div>
                      <div className="user-progress">
                        <h6 className="mb-0">849k</h6>
                      </div>
                    </div>
                  </li>
                  <li className="d-flex align-items-center">
                    <div className="avatar flex-shrink-0 me-3">
                      <span className="avatar-initial rounded bg-label-secondary">
                        <i className="icon-base bx bx-football"></i>
                      </span>
                    </div>
                    <div className="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                      <div className="me-2">
                        <h6 className="mb-0">{t('dashboard.categorySports')}</h6>
                        <small>{t('dashboard.categorySportsDesc')}</small>
                      </div>
                      <div className="user-progress">
                        <h6 className="mb-0">99</h6>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          {/*/ Order Statistics */}

          {/* Expense Overview */}
          <div className="col-md-6 col-lg-4 order-1 mb-6">
            <div className="card h-100">
              <div className="card-header nav-align-top">
                <ul
                  className="nav nav-pills flex-wrap row-gap-2"
                  role="tablist"
                >
                  <li className="nav-item">
                    <button
                      type="button"
                      className="nav-link active"
                      role="tab"
                      data-bs-toggle="tab"
                      data-bs-target="#navs-tabs-line-card-income"
                      aria-controls="navs-tabs-line-card-income"
                      aria-selected="true"
                    >
                      {t('dashboard.income')}
                    </button>
                  </li>
                  <li className="nav-item">
                    <button type="button" className="nav-link" role="tab">
                      {t('dashboard.expenses')}
                    </button>
                  </li>
                  <li className="nav-item">
                    <button type="button" className="nav-link" role="tab">
                      {t('dashboard.profit')}
                    </button>
                  </li>
                </ul>
              </div>
              <div className="card-body">
                <div className="tab-content p-0">
                  <div
                    className="tab-pane fade show active"
                    id="navs-tabs-line-card-income"
                    role="tabpanel"
                  >
                    <div className="d-flex mb-6">
                      <div className="avatar flex-shrink-0 me-3">
                        <img
                          src="/assets/img/icons/unicons/wallet-primary.png"
                          alt="User"
                        />
                      </div>
                      <div>
                        <p className="mb-0">{t('dashboard.totalBalance')}</p>
                        <div className="d-flex align-items-center">
                          <h6 className="mb-0 me-1">$459.10</h6>
                          <small className="text-success fw-medium">
                            <i className="icon-base bx bx-chevron-up icon-lg"></i>
                            42.9%
                          </small>
                        </div>
                      </div>
                    </div>
                    <div id="incomeChart"></div>
                    <div className="d-flex align-items-center justify-content-center mt-6 gap-3">
                      <div className="flex-shrink-0">
                        <div id="expensesOfWeek"></div>
                      </div>
                      <div>
                        <h6 className="mb-0">{t('dashboard.incomeThisWeek')}</h6>
                        <small>{t('dashboard.lessThanLastWeek', { amount: '$39k' })}</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/*/ Expense Overview */}

          {/* Transactions */}
          <div className="col-md-6 col-lg-4 order-2 mb-6">
            <div className="card h-100">
              <div className="card-header d-flex align-items-center justify-content-between">
                <h5 className="card-title m-0 me-2">{t('dashboard.transactions')}</h5>
                <div className="dropdown">
                  <button
                    className="btn text-body-secondary p-0"
                    type="button"
                    id="transactionID"
                    data-bs-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <i className="icon-base bx bx-dots-vertical-rounded icon-lg"></i>
                  </button>
                  <div
                    className="dropdown-menu dropdown-menu-end"
                    aria-labelledby="transactionID"
                  >
                    <a className="dropdown-item" href="#">{t('dashboard.last28Days')}</a>
                    <a className="dropdown-item" href="#">{t('dashboard.lastMonth')}</a>
                    <a className="dropdown-item" href="#">{t('dashboard.lastYear')}</a>
                  </div>
                </div>
              </div>
              <div className="card-body pt-4">
                <ul className="p-0 m-0">
                  <li className="d-flex align-items-center mb-6">
                    <div className="avatar flex-shrink-0 me-3">
                      <img
                        src="/assets/img/icons/unicons/paypal.png"
                        alt="User"
                        className="rounded"
                      />
                    </div>
                    <div className="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                      <div className="me-2">
                        <small className="d-block">{t('dashboard.txPaypal')}</small>
                        <h6 className="fw-normal mb-0">{t('dashboard.txSendMoney')}</h6>
                      </div>
                      <div className="user-progress d-flex align-items-center gap-2">
                        <h6 className="fw-normal mb-0">+82.6</h6>
                        <span className="text-body-secondary">USD</span>
                      </div>
                    </div>
                  </li>
                  <li className="d-flex align-items-center mb-6">
                    <div className="avatar flex-shrink-0 me-3">
                      <img
                        src="/assets/img/icons/unicons/wallet.png"
                        alt="User"
                        className="rounded"
                      />
                    </div>
                    <div className="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                      <div className="me-2">
                        <small className="d-block">{t('dashboard.txWallet')}</small>
                        <h6 className="fw-normal mb-0">{t('dashboard.txMacd')}</h6>
                      </div>
                      <div className="user-progress d-flex align-items-center gap-2">
                        <h6 className="fw-normal mb-0">+270.69</h6>
                        <span className="text-body-secondary">USD</span>
                      </div>
                    </div>
                  </li>
                  <li className="d-flex align-items-center mb-6">
                    <div className="avatar flex-shrink-0 me-3">
                      <img
                        src="/assets/img/icons/unicons/chart.png"
                        alt="User"
                        className="rounded"
                      />
                    </div>
                    <div className="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                      <div className="me-2">
                        <small className="d-block">{t('dashboard.txTransfer')}</small>
                        <h6 className="fw-normal mb-0">{t('dashboard.txRefund')}</h6>
                      </div>
                      <div className="user-progress d-flex align-items-center gap-2">
                        <h6 className="fw-normal mb-0">+637.91</h6>
                        <span className="text-body-secondary">USD</span>
                      </div>
                    </div>
                  </li>
                  <li className="d-flex align-items-center mb-6">
                    <div className="avatar flex-shrink-0 me-3">
                      <img
                        src="/assets/img/icons/unicons/cc-primary.png"
                        alt="User"
                        className="rounded"
                      />
                    </div>
                    <div className="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                      <div className="me-2">
                        <small className="d-block">{t('dashboard.txCreditCard')}</small>
                        <h6 className="fw-normal mb-0">{t('dashboard.txOrderedFood')}</h6>
                      </div>
                      <div className="user-progress d-flex align-items-center gap-2">
                        <h6 className="fw-normal mb-0">-838.71</h6>
                        <span className="text-body-secondary">USD</span>
                      </div>
                    </div>
                  </li>
                  <li className="d-flex align-items-center mb-6">
                    <div className="avatar flex-shrink-0 me-3">
                      <img
                        src="/assets/img/icons/unicons/wallet.png"
                        alt="User"
                        className="rounded"
                      />
                    </div>
                    <div className="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                      <div className="me-2">
                        <small className="d-block">{t('dashboard.txWallet')}</small>
                        <h6 className="fw-normal mb-0">{t('dashboard.txStarbucks')}</h6>
                      </div>
                      <div className="user-progress d-flex align-items-center gap-2">
                        <h6 className="fw-normal mb-0">+203.33</h6>
                        <span className="text-body-secondary">USD</span>
                      </div>
                    </div>
                  </li>
                  <li className="d-flex align-items-center">
                    <div className="avatar flex-shrink-0 me-3">
                      <img
                        src="/assets/img/icons/unicons/cc-warning.png"
                        alt="User"
                        className="rounded"
                      />
                    </div>
                    <div className="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                      <div className="me-2">
                        <small className="d-block">{t('dashboard.txMastercard')}</small>
                        <h6 className="fw-normal mb-0">{t('dashboard.txOrderedFood')}</h6>
                      </div>
                      <div className="user-progress d-flex align-items-center gap-2">
                        <h6 className="fw-normal mb-0">-92.45</h6>
                        <span className="text-body-secondary">USD</span>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          {/*/ Transactions */}
          {/* Activity Timeline */}
          <div className="col-md-12 col-lg-6 order-4 order-lg-3">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between">
                <h5 className="card-title m-0 me-2">{t('dashboard.activityTimeline')}</h5>
                <div className="dropdown">
                  <button
                    className="btn text-body-secondary p-0"
                    type="button"
                    id="timelineWapper"
                    data-bs-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <i className="icon-base bx bx-dots-vertical-rounded icon-lg"></i>
                  </button>
                  <div
                    className="dropdown-menu dropdown-menu-end"
                    aria-labelledby="timelineWapper"
                  >
                    <a className="dropdown-item" href="#">
                      Select All
                    </a>
                    <a className="dropdown-item" href="#">
                      Refresh
                    </a>
                    <a className="dropdown-item" href="#">
                      Share
                    </a>
                  </div>
                </div>
              </div>
              <div className="card-body pt-2">
                <ul className="timeline mb-0">
                  <li className="timeline-item timeline-item-transparent">
                    <span className="timeline-point timeline-point-primary"></span>
                    <div className="timeline-event">
                      <div className="timeline-header mb-3">
                        <h6 className="mb-0">12 Invoices have been paid</h6>
                        <small className="text-body-secondary">
                          12 min ago
                        </small>
                      </div>
                      <p className="mb-2">
                        Invoices have been paid to the company
                      </p>
                      <div className="d-flex align-items-center mb-1">
                        <div className="badge bg-lighter rounded-2">
                          <span className="h6 mb-0 text-body">
                            invoices.pdf
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className="timeline-item timeline-item-transparent">
                    <span className="timeline-point timeline-point-success"></span>
                    <div className="timeline-event">
                      <div className="timeline-header mb-3">
                        <h6 className="mb-0">Client Meeting</h6>
                        <small className="text-body-secondary">
                          {t('dashboard.timelineMeetingTimeAgo')}
                        </small>
                      </div>
                      <p className="mb-2">{t('dashboard.timelineMeetingTitle')}</p>
                      <div className="d-flex justify-content-between flex-wrap gap-2">
                        <div className="d-flex flex-wrap align-items-center">
                          <div className="avatar avatar-sm me-2">
                            <img
                              src="/assets/img/avatars/1.png"
                              alt="Avatar"
                              className="rounded-circle"
                            />
                          </div>
                          <div>
                            <p className="mb-0 small fw-medium">
                              {t('dashboard.timelineMeetingClient')}
                            </p>
                            <small>{t('dashboard.timelineMeetingClientRole')}</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className="timeline-item timeline-item-transparent">
                    <span className="timeline-point timeline-point-info"></span>
                    <div className="timeline-event">
                      <div className="timeline-header mb-3">
                        <h6 className="mb-0">{t('dashboard.timelineProjectCreateTitle')}</h6>
                        <small className="text-body-secondary">{t('dashboard.timelineProjectCreateTimeAgo')}</small>
                      </div>
                      <p className="mb-2">{t('dashboard.timelineProjectMembers')}</p>
                      <ul className="list-group list-group-flush">
                        <li className="list-group-item d-flex justify-content-between align-items-center flex-wrap p-0">
                          <div className="d-flex flex-wrap align-items-center">
                            <ul className="list-unstyled users-list d-flex align-items-center avatar-group m-0 me-2">
                              <li
                                data-bs-toggle="tooltip"
                                data-popup="tooltip-custom"
                                data-bs-placement="top"
                                title={t('dashboard.timelineUser1')}
                                className="avatar pull-up"
                              >
                                <img
                                  className="rounded-circle"
                                  src="/assets/img/avatars/5.png"
                                  alt="Avatar"
                                />
                              </li>
                              <li
                                data-bs-toggle="tooltip"
                                data-popup="tooltip-custom"
                                data-bs-placement="top"
                                title={t('dashboard.timelineUser2')}
                                className="avatar pull-up"
                              >
                                <img
                                  className="rounded-circle"
                                  src="/assets/img/avatars/12.png"
                                  alt="Avatar"
                                />
                              </li>
                              <li
                                data-bs-toggle="tooltip"
                                data-popup="tooltip-custom"
                                data-bs-placement="top"
                                title={t('dashboard.timelineUser3')}
                                className="avatar pull-up"
                              >
                                <img
                                  className="rounded-circle"
                                  src="/assets/img/avatars/6.png"
                                  alt="Avatar"
                                />
                              </li>
                              <li className="avatar">
                                <span
                                  className="avatar-initial rounded-circle pull-up text-heading"
                                  data-bs-toggle="tooltip"
                                  data-bs-placement="bottom"
                                  title={t('dashboard.timelineMoreUsers')}
                                >
                                  +3
                                </span>
                              </li>
                            </ul>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          {/*/ Activity Timeline */}
          {/* pill table */}
          <div className="col-md-6 order-3 order-lg-4 mb-6 mb-lg-0">
            <div className="card text-center h-100">
              <div className="card-header nav-align-top">
                <ul
                  className="nav nav-pills flex-wrap row-gap-2"
                  role="tablist"
                >
                  <li className="nav-item">
                    <button
                      type="button"
                      className="nav-link active"
                      role="tab"
                      data-bs-toggle="tab"
                      data-bs-target="#navs-pills-browser"
                      aria-controls="navs-pills-browser"
                      aria-selected="true"
                    >
                      {t('dashboard.tabsBrowser')}
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className="nav-link"
                      role="tab"
                      data-bs-toggle="tab"
                      data-bs-target="#navs-pills-os"
                      aria-controls="navs-pills-os"
                      aria-selected="false"
                    >
                      {t('dashboard.tabsOS')}
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className="nav-link"
                      role="tab"
                      data-bs-toggle="tab"
                      data-bs-target="#navs-pills-country"
                      aria-controls="navs-pills-country"
                      aria-selected="false"
                    >
                      {t('dashboard.tabsCountry')}
                    </button>
                  </li>
                </ul>
              </div>
              <div className="tab-content pt-0 pb-4">
                <div
                  className="tab-pane fade show active"
                  id="navs-pills-browser"
                  role="tabpanel"
                >
                  <div className="table-responsive text-start text-nowrap">
                    <table className="table table-borderless">
                      <thead>
                        <tr>
                          <th>{t('dashboard.tableNo')}</th>
                          <th>{t('dashboard.tableBrowser')}</th>
                          <th>{t('dashboard.tableVisits')}</th>
                          <th className="w-50">{t('dashboard.tablePercentage')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>1</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src="/assets/img/icons/brands/chrome.png"
                                alt="Chrome"
                                height="24"
                                className="me-3"
                              />
                              <span className="text-heading">{t('dashboard.browserChrome')}</span>
                            </div>
                          </td>
                          <td className="text-heading">8.92k</td>
                          <td>
                            <div className="d-flex justify-content-between align-items-center gap-4">
                              <div
                                className="progress w-100"
                                style={{ height: 10 }}
                              >
                                <div
                                  className="progress-bar bg-success"
                                  role="progressbar"
                                  style={{ width: "64.75%" }}
                                  aria-valuenow={64.75}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <small className="fw-medium">64.75%</small>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>2</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src="/assets/img/icons/brands/safari.png"
                                alt="Safari"
                                height="24"
                                className="me-3"
                              />
                              <span className="text-heading">{t('dashboard.browserSafari')}</span>
                            </div>
                          </td>
                          <td className="text-heading">1.29k</td>
                          <td>
                            <div className="d-flex justify-content-between align-items-center gap-4">
                              <div
                                className="progress w-100"
                                style={{ height: 10 }}
                              >
                                <div
                                  className="progress-bar bg-primary"
                                  role="progressbar"
                                  style={{ width: "18.43%" }}
                                  aria-valuenow={18.43}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <small className="fw-medium">18.43%</small>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>3</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src="/assets/img/icons/brands/firefox.png"
                                alt="Firefox"
                                height="24"
                                className="me-3"
                              />
                              <span className="text-heading">{t('dashboard.browserFirefox')}</span>
                            </div>
                          </td>
                          <td className="text-heading">328</td>
                          <td>
                            <div className="d-flex justify-content-between align-items-center gap-4">
                              <div
                                className="progress w-100"
                                style={{ height: 10 }}
                              >
                                <div
                                  className="progress-bar bg-info"
                                  role="progressbar"
                                  style={{ width: "8.37%" }}
                                  aria-valuenow={8.37}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <small className="fw-medium">8.37%</small>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>4</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src="/assets/img/icons/brands/edge.png"
                                alt="Edge"
                                height="24"
                                className="me-3"
                              />
                              <span className="text-heading">{t('dashboard.browserEdge')}</span>
                            </div>
                          </td>
                          <td className="text-heading">142</td>
                          <td>
                            <div className="d-flex justify-content-between align-items-center gap-4">
                              <div
                                className="progress w-100"
                                style={{ height: 10 }}
                              >
                                <div
                                  className="progress-bar bg-warning"
                                  role="progressbar"
                                  style={{ width: "6.12%" }}
                                  aria-valuenow={6.12}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <small className="fw-medium">6.12%</small>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>5</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src="/assets/img/icons/brands/opera.png"
                                alt="Opera"
                                height="24"
                                className="me-3"
                              />
                              <span className="text-heading">{t('dashboard.browserOpera')}</span>
                            </div>
                          </td>
                          <td className="text-heading">82</td>
                          <td>
                            <div className="d-flex justify-content-between align-items-center gap-4">
                              <div
                                className="progress w-100"
                                style={{ height: 10 }}
                              >
                                <div
                                  className="progress-bar bg-danger"
                                  role="progressbar"
                                  style={{ width: "2.12%" }}
                                  aria-valuenow={1.94}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <small className="fw-medium">2.12%</small>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>6</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src="/assets/img/icons/brands/uc.png"
                                alt="uc"
                                height="24"
                                className="me-3"
                              />
                              <span className="text-heading">{t('dashboard.browserUc')}</span>
                            </div>
                          </td>
                          <td className="text-heading">328</td>
                          <td>
                            <div className="d-flex justify-content-between align-items-center gap-4">
                              <div
                                className="progress w-100"
                                style={{ height: 10 }}
                              >
                                <div
                                  className="progress-bar bg-danger"
                                  role="progressbar"
                                  style={{ width: "20.14%" }}
                                  aria-valuenow={1.94}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <small className="fw-medium">20.14%</small>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div
                  className="tab-pane fade"
                  id="navs-pills-os"
                  role="tabpanel"
                >
                  <div className="table-responsive text-start text-nowrap">
                    <table className="table table-borderless">
                      <thead>
                        <tr>
                          <th>{t('dashboard.tableNo')}</th>
                          <th>{t('dashboard.tableSystem')}</th>
                          <th>{t('dashboard.tableVisits')}</th>
                          <th className="w-50">{t('dashboard.tablePercentage')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>1</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src="/assets/img/icons/brands/windows.png"
                                alt="Windows"
                                height="24"
                                className="me-3"
                              />
                              <span className="text-heading">{t('dashboard.osWindows')}</span>
                            </div>
                          </td>
                          <td className="text-heading">875.24k</td>
                          <td>
                            <div className="d-flex justify-content-between align-items-center gap-4">
                              <div
                                className="progress w-100"
                                style={{ height: 10 }}
                              >
                                <div
                                  className="progress-bar bg-success"
                                  role="progressbar"
                                  style={{ width: "61.5%" }}
                                  aria-valuenow={61.5}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <small className="fw-medium">61.50%</small>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>2</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src="../../assets/img/icons/brands/mac.png"
                                alt="Mac"
                                height="24"
                                className="me-3"
                              />
                              <span className="text-heading">{t('dashboard.osMac')}</span>
                            </div>
                          </td>
                          <td className="text-heading">89.68k</td>
                          <td>
                            <div className="d-flex justify-content-between align-items-center gap-4">
                              <div
                                className="progress w-100"
                                style={{ height: 10 }}
                              >
                                <div
                                  className="progress-bar bg-primary"
                                  role="progressbar"
                                  style={{ width: "16.67%" }}
                                  aria-valuenow={16.67}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <small className="fw-medium">16.67%</small>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>3</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src="../../assets/img/icons/brands/ubuntu.png"
                                alt="Ubuntu"
                                height="24"
                                className="me-3"
                              />
                              <span className="text-heading">{t('dashboard.osUbuntu')}</span>
                            </div>
                          </td>
                          <td className="text-heading">37.68k</td>
                          <td>
                            <div className="d-flex justify-content-between align-items-center gap-4">
                              <div
                                className="progress w-100"
                                style={{ height: 10 }}
                              >
                                <div
                                  className="progress-bar bg-info"
                                  role="progressbar"
                                  style={{ width: "12.82%" }}
                                  aria-valuenow={12.82}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <small className="fw-medium">12.82%</small>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>4</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src="../../assets/img/icons/brands/chrome.png"
                                alt="Chrome"
                                height="24"
                                className="me-3"
                              />
                              <span className="text-heading">{t('dashboard.osChrome')}</span>
                            </div>
                          </td>
                          <td className="text-heading">8.34k</td>
                          <td>
                            <div className="d-flex justify-content-between align-items-center gap-4">
                              <div
                                className="progress w-100"
                                style={{ height: 10 }}
                              >
                                <div
                                  className="progress-bar bg-warning"
                                  role="progressbar"
                                  style={{ width: "6.25%" }}
                                  aria-valuenow={6.25}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <small className="fw-medium">6.25%</small>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>5</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src="../../assets/img/icons/brands/cent.png"
                                alt="Cent"
                                height="24"
                                className="me-3"
                              />
                              <span className="text-heading">{t('dashboard.osCent')}</span>
                            </div>
                          </td>
                          <td className="text-heading">2.25k</td>
                          <td>
                            <div className="d-flex justify-content-between align-items-center gap-4">
                              <div
                                className="progress w-100"
                                style={{ height: 10 }}
                              >
                                <div
                                  className="progress-bar bg-danger"
                                  role="progressbar"
                                  style={{ width: "2.76%" }}
                                  aria-valuenow={2.76}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <small className="fw-medium">2.76%</small>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>6</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src="../../assets/img/icons/brands/linux.png"
                                alt="linux"
                                height="24"
                                className="me-3"
                              />
                              <span className="text-heading">{t('dashboard.osLinux')}</span>
                            </div>
                          </td>
                          <td className="text-heading">328k</td>
                          <td>
                            <div className="d-flex justify-content-between align-items-center gap-4">
                              <div
                                className="progress w-100"
                                style={{ height: 10 }}
                              >
                                <div
                                  className="progress-bar bg-danger"
                                  role="progressbar"
                                  style={{ width: "20.14%" }}
                                  aria-valuenow={2.76}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <small className="fw-medium">20.14%</small>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div
                  className="tab-pane fade"
                  id="navs-pills-country"
                  role="tabpanel"
                >
                  <div className="table-responsive text-start text-nowrap">
                    <table className="table table-borderless">
                      <thead>
                        <tr>
                          <th>{t('dashboard.tableNo')}</th>
                          <th>{t('dashboard.tableCountry')}</th>
                          <th>{t('dashboard.tableVisits')}</th>
                          <th className="w-50">{t('dashboard.tablePercentage')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>1</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fis fi fi-us rounded-circle fs-4 me-3"></i>
                              <span className="text-heading">{t('dashboard.countryUsa')}</span>
                            </div>
                          </td>
                          <td className="text-heading">87.24k</td>
                          <td>
                            <div className="d-flex justify-content-between align-items-center gap-4">
                              <div
                                className="progress w-100"
                                style={{ height: 10 }}
                              >
                                <div
                                  className="progress-bar bg-success"
                                  role="progressbar"
                                  style={{ width: "38.12%" }}
                                  aria-valuenow={38.12}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <small className="fw-medium">38.12%</small>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>2</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fis fi fi-br rounded-circle fs-4 me-3"></i>
                              <span className="text-heading">{t('dashboard.countryBrazil')}</span>
                            </div>
                          </td>
                          <td className="text-heading">42.68k</td>
                          <td>
                            <div className="d-flex justify-content-between align-items-center gap-4">
                              <div
                                className="progress w-100"
                                style={{ height: 10 }}
                              >
                                <div
                                  className="progress-bar bg-primary"
                                  role="progressbar"
                                  style={{ width: "28.23%" }}
                                  aria-valuenow={28.23}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <small className="fw-medium">28.23%</small>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>3</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fis fi fi-in rounded-circle fs-4 me-3"></i>
                              <span className="text-heading">{t('dashboard.countryIndia')}</span>
                            </div>
                          </td>
                          <td className="text-heading">12.58k</td>
                          <td>
                            <div className="d-flex justify-content-between align-items-center gap-4">
                              <div
                                className="progress w-100"
                                style={{ height: 10 }}
                              >
                                <div
                                  className="progress-bar bg-info"
                                  role="progressbar"
                                  style={{ width: "14.82%" }}
                                  aria-valuenow={14.82}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <small className="fw-medium">14.82%</small>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>4</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fis fi fi-au rounded-circle fs-4 me-3"></i>
                              <span className="text-heading">{t('dashboard.countryAustralia')}</span>
                            </div>
                          </td>
                          <td className="text-heading">4.13k</td>
                          <td>
                            <div className="d-flex justify-content-between align-items-center gap-4">
                              <div
                                className="progress w-100"
                                style={{ height: 10 }}
                              >
                                <div
                                  className="progress-bar bg-warning"
                                  role="progressbar"
                                  style={{ width: "12.72%" }}
                                  aria-valuenow={12.72}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <small className="fw-medium">12.72%</small>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>5</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fis fi fi-fr rounded-circle fs-4 me-3"></i>
                              <span className="text-heading">{t('dashboard.countryFrance')}</span>
                            </div>
                          </td>
                          <td className="text-heading">2.21k</td>
                          <td>
                            <div className="d-flex justify-content-between align-items-center gap-4">
                              <div
                                className="progress w-100"
                                style={{ height: 10 }}
                              >
                                <div
                                  className="progress-bar bg-danger"
                                  role="progressbar"
                                  style={{ width: "7.11%" }}
                                  aria-valuenow={7.11}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <small className="fw-medium">7.11%</small>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>6</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fis fi fi-ca rounded-circle fs-4 me-3"></i>
                              <span className="text-heading">{t('dashboard.countryCanada')}</span>
                            </div>
                          </td>
                          <td className="text-heading">22.35k</td>
                          <td>
                            <div className="d-flex justify-content-between align-items-center gap-4">
                              <div
                                className="progress w-100"
                                style={{ height: 10 }}
                              >
                                <div
                                  className="progress-bar bg-danger"
                                  role="progressbar"
                                  style={{ width: "15.13%" }}
                                  aria-valuenow={7.11}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <small className="fw-medium">15.13%</small>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/*/ pill table */}
        </div>
      </div>
      {/* / Content */}

    </div>
  );
}
