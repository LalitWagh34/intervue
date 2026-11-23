import { beforeEach, describe, expect, it, mock } from "bun:test";
import { db } from "@intervue/db";
import { searchRouter } from "../routes/search";

describe("global search integrity", () => {
  beforeEach(() => {
    mock.restore();
  });

  it("restricts problem results to published content", async () => {
    let problemQuery: any;
    db.problem.findMany = mock(async (query: any) => {
      problemQuery = query;
      return [];
    });
    db.dsaSheet.findMany = mock(async () => []);

    const response = await searchRouter.request("/?q=array");

    expect(response.status).toBe(200);
    expect(problemQuery.where.status).toBe("published");
    expect(problemQuery.take).toBe(5);
  });

  it("does not query the database for undersized search terms", async () => {
    const findProblems = mock(async () => []);
    const findSheets = mock(async () => []);
    db.problem.findMany = findProblems;
    db.dsaSheet.findMany = findSheets;

    const response = await searchRouter.request("/?q=a");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ problems: [], sheets: [] });
    expect(findProblems).not.toHaveBeenCalled();
    expect(findSheets).not.toHaveBeenCalled();
  });
});
